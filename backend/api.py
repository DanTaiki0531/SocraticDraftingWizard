from fastapi import APIRouter, HTTPException
from typing import List
from backend.models import GenerateRequest, GenerateResponse, TemplateUpdate, QuestionBase
from backend.database import supabase
import uuid
from datetime import datetime

router = APIRouter()


@router.get("/templates")
async def get_templates():
    """利用可能なカテゴリ一覧を取得"""
    response = supabase.table("templates").select("category_id, name, description").execute()
    
    categories = [
        {"id": row["category_id"], "name": row["name"], "description": row.get("description")}
        for row in response.data
    ]
    return {"categories": categories}


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
