from fastapi import APIRouter, HTTPException
from typing import List
from backend.models import GenerateRequest, GenerateResponse, TemplateUpdate, QuestionBase, CategoryCreate, CategoryResponse
from backend.database import supabase
import uuid
from datetime import datetime

router = APIRouter()


# デフォルトカテゴリ（削除不可）
DEFAULT_CATEGORIES = {"academic", "technical", "custom"}


@router.get("/templates")
async def get_templates():
    """利用可能なカテゴリ一覧を取得"""
    # テンプレートと質問を結合して取得
    response = supabase.table("templates").select("id, category_id, name, description").execute()
    
    categories = []
    for row in response.data:
        # 各カテゴリの質問数を取得
        questions_response = supabase.table("questions").select("id", count="exact").eq("template_id", row["id"]).execute()
        question_count = questions_response.count if questions_response.count is not None else 0
        
        categories.append({
            "id": row["category_id"],
            "name": row["name"],
            "description": row.get("description"),
            "is_default": row["category_id"] in DEFAULT_CATEGORIES,
            "question_count": question_count
        })
    
    return {"categories": categories}


@router.post("/templates", response_model=CategoryResponse)
async def create_template(category: CategoryCreate):
    """新規カテゴリを作成"""
    # category_idを生成（名前をスラグ化）
    import re
    category_id = re.sub(r'[^a-z0-9]+', '-', category.name.lower()).strip('-')
    
    # 既存チェック
    existing = supabase.table("templates").select("id").eq("category_id", category_id).execute()
    if existing.data:
        # ユニークにするためにUUIDサフィックスを追加
        category_id = f"{category_id}-{str(uuid.uuid4())[:8]}"
    
    # 新規カテゴリを挿入
    new_template = {
        "id": str(uuid.uuid4()),
        "category_id": category_id,
        "name": category.name,
        "description": category.description
    }
    
    supabase.table("templates").insert(new_template).execute()
    
    return CategoryResponse(
        id=category_id,
        name=category.name,
        description=category.description,
        is_default=False
    )


@router.delete("/templates/{category_id}")
async def delete_template(category_id: str):
    """カテゴリを削除"""
    # テンプレートを取得
    template_response = supabase.table("templates").select("id").eq("category_id", category_id).execute()
    
    if not template_response.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    template_id = template_response.data[0]["id"]
    
    # 質問を削除（CASCADE設定があるがexplicitに）
    supabase.table("questions").delete().eq("template_id", template_id).execute()
    
    # テンプレートを削除
    supabase.table("templates").delete().eq("id", template_id).execute()
    
    return {"status": "success", "deleted": category_id}


@router.get("/templates/{category_id}")
async def get_template_questions(category_id: str):
    """指定したカテゴリの質問リストを取得"""
    # まずテンプレートIDを取得
    template_response = supabase.table("templates").select("id").eq("category_id", category_id).execute()
    
    if not template_response.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    template_id = template_response.data[0]["id"]
    
    # 質問を取得
    questions_response = (
        supabase.table("questions")
        .select("id, text, order_index")
        .eq("template_id", template_id)
        .order("order_index")
        .execute()
    )
    
    return questions_response.data


@router.put("/templates/{category_id}")
async def update_template(category_id: str, template_update: TemplateUpdate):
    """質問の追加・削除・並び替え結果を保存"""
    # テンプレートIDを取得
    template_response = supabase.table("templates").select("id").eq("category_id", category_id).execute()
    
    if not template_response.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    template_id = template_response.data[0]["id"]
    
    # 既存の質問を削除
    supabase.table("questions").delete().eq("template_id", template_id).execute()
    
    # 新しい質問を挿入
    new_questions = [
        {
            "id": q.id if q.id else str(uuid.uuid4()),
            "template_id": template_id,
            "text": q.text,
            "order_index": q.order_index
        }
        for q in template_update.questions
    ]
    
    if new_questions:
        supabase.table("questions").insert(new_questions).execute()
    
    # テンプレートの更新日時を更新
    supabase.table("templates").update({"updated_at": datetime.utcnow().isoformat()}).eq("id", template_id).execute()
    
    return {"status": "success", "count": len(new_questions)}


@router.post("/generate", response_model=GenerateResponse)
async def generate_markdown(request: GenerateRequest):
    """回答からMarkdownを生成"""
    # カテゴリ名を取得
    template_response = supabase.table("templates").select("name").eq("category_id", request.category_id).execute()
    
    title = "分析結果"
    if template_response.data:
        title = template_response.data[0]["name"]
    
    # Markdown生成
    markdown = f"# {title}\n\n"
    markdown += f"*作成日：{datetime.now().strftime('%Y年%m月%d日')}*\n\n---\n\n"

    for item in request.answers:
        markdown += f"## {item.text}\n\n"
        markdown += f"{item.answer}\n\n"
    
    markdown += "---\n\n"
    markdown += "## まとめ\n\n"
    markdown += f"この分析では、トピックの{len(request.answers)}つの重要な側面を網羅し、理解とさらなる探求のための構造化されたフレームワークを提供しています。\n"

    # 生成ログを保存
    log_id = str(uuid.uuid4())
    answers_json = [{"question_id": a.question_id, "text": a.text, "answer": a.answer} for a in request.answers]
    
    supabase.table("generation_logs").insert({
        "id": log_id,
        "category_id": request.category_id,
        "markdown": markdown,
        "answers": answers_json
    }).execute()

    return GenerateResponse(
        markdown=markdown,
        log_id=log_id
    )
