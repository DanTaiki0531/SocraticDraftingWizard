from fastapi import APIRouter, HTTPException
from typing import List
from backend.models import GenerateRequest, GenerateResponse, TemplateUpdate, QuestionBase, CategoryCreate, CategoryResponse, Tag, TagCreate, CategoryReorderRequest
from backend.database import supabase
import uuid
from datetime import datetime

router = APIRouter()


# デフォルトカテゴリ（削除不可）
DEFAULT_CATEGORIES = {"academic", "technical", "custom"}


@router.get("/templates")
async def get_templates():
    """利用可能なカテゴリ一覧を取得"""
    # 1. テンプレートと質問数を一括取得 (questionsのリレーションを利用)
    # Supabaseのembedding機能を使って質問数を取得したいが、count機能との併用が難しいため
    # まずテンプレートを取得し、並列または効率的なクエリでデータを補完する方針をとる
    
    # テンプレート取得 (order_indexでソート)
    templates_response = supabase.table("templates").select("id, category_id, name, description, order_index, created_at").order("order_index").order("created_at").execute()
    categories_data = templates_response.data
    
    if not categories_data:
        return {"categories": []}

    # 2. 全カテゴリIDとテンプレートIDのリスト作成
    category_ids = [c["category_id"] for c in categories_data]
    template_ids = [c["id"] for c in categories_data]
    
    # 3. 質問データを一括取得 (template_idのみ)
    # count取得のために全件取得は非効率だが、現状の規模なら許容範囲
    # 将来的にはRPC (Stored Procedure) での集計が望ましい
    questions_response = supabase.table("questions").select("template_id").in_("template_id", template_ids).execute()
    
    # 質問数をメモリ上で集計
    question_counts = {}
    for q in questions_response.data:
        tid = q["template_id"]
        question_counts[tid] = question_counts.get(tid, 0) + 1
        
    # 4. カテゴリタグを一括取得
    cat_tags_response = supabase.table("category_tags").select("category_id, tag_id").in_("category_id", category_ids).execute()
    
    # タグIDリスト作成
    all_tag_ids = list(set([ct["tag_id"] for ct in cat_tags_response.data]))
    
    # 5. タグ詳細を一括取得
    tags_map = {}
    if all_tag_ids:
        tags_response = supabase.table("tags").select("id, name, color").in_("id", all_tag_ids).execute()
        for t in tags_response.data:
            tags_map[t["id"]] = {"id": t["id"], "name": t["name"], "color": t["color"]}
            
    # カテゴリ毎のタグリスト構築
    category_tags_map = {cid: [] for cid in category_ids}
    for ct in cat_tags_response.data:
        cid = ct["category_id"]
        tid = ct["tag_id"]
        if tid in tags_map:
            category_tags_map[cid].append(tags_map[tid])
    
    # 6. レスポンス構築
    categories = []
    for row in categories_data:
        categories.append({
            "id": row["category_id"],
            "name": row["name"],
            "description": row.get("description"),
            "order_index": row.get("order_index", 0),
            "created_at": row.get("created_at"),
            "is_default": row["category_id"] in DEFAULT_CATEGORIES,
            "question_count": question_counts.get(row["id"], 0),
            "tags": category_tags_map.get(row["category_id"], [])
        })
    
    return {"categories": categories}


@router.put("/templates/reorder")
async def reorder_templates(request: CategoryReorderRequest):
    """カテゴリの表示順序を更新"""
    for item in request.orders:
        supabase.table("templates")\
            .update({"order_index": item["order_index"]})\
            .eq("category_id", item["id"])\
            .execute()
    
    return {"status": "success"}


@router.post("/templates", response_model=CategoryResponse)
async def create_template(category: CategoryCreate):
    """新規カテゴリを作成"""
    # category_idを生成（名前をスラグ化）
    import re
    category_id = re.sub(r'[^a-z0-9]+', '-', category.name.lower()).strip('-')
    
    # スラグが空の場合（日本語のみの場合など）はデフォルト名を使用
    if not category_id:
        category_id = "category"

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


@router.get("/tags")
async def get_tags():
    """利用可能なタグ一覧を取得"""
    response = supabase.table("tags").select("id, name, color").order("name").execute()
    
    tags = [
        Tag(id=row["id"], name=row["name"], color=row["color"])
        for row in response.data
    ]
    return {"tags": tags}


@router.post("/tags", response_model=Tag)
async def create_tag(tag: TagCreate):
    """新規タグを作成"""
    # 既存チェック
    existing = supabase.table("tags").select("id").eq("name", tag.name).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="このタグ名は既に存在します")
    
    new_tag = {
        "id": str(uuid.uuid4()),
        "name": tag.name,
        "color": tag.color
    }
    
    supabase.table("tags").insert(new_tag).execute()
    
    return Tag(id=new_tag["id"], name=new_tag["name"], color=new_tag["color"])


@router.post("/drafts/{draft_id}/tags")
async def add_tags_to_draft(draft_id: str, tag_ids: List[str]):
    """ドラフトにタグを関連付け"""
    # ドラフト存在チェック
    draft_response = supabase.table("generation_logs").select("id").eq("id", draft_id).execute()
    if not draft_response.data:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    # 既存のタグを削除
    supabase.table("draft_tags").delete().eq("draft_id", draft_id).execute()
    
    # 新しいタグを追加
    if tag_ids:
        draft_tags = [
            {
                "id": str(uuid.uuid4()),
                "draft_id": draft_id,
                "tag_id": tag_id
            }
            for tag_id in tag_ids
        ]
        supabase.table("draft_tags").insert(draft_tags).execute()
    
    return {"status": "success", "draft_id": draft_id, "tag_count": len(tag_ids)}


@router.get("/categories/{category_id}/tags")
async def get_category_tags(category_id: str):
    """カテゴリに設定されているタグを取得"""
    response = supabase.table("category_tags").select("tag_id").eq("category_id", category_id).execute()
    
    tag_ids = [row["tag_id"] for row in response.data]
    
    if not tag_ids:
        return {"tags": []}
    
    # タグの詳細を取得
    tags_response = supabase.table("tags").select("id, name, color").in_("id", tag_ids).execute()
    
    tags = [
        Tag(id=row["id"], name=row["name"], color=row["color"])
        for row in tags_response.data
    ]
    return {"tags": tags}


@router.post("/categories/{category_id}/tags")
async def set_category_tags(category_id: str, tag_ids: List[str]):
    """カテゴリにタグを設定"""
    # 既存のタグを削除
    supabase.table("category_tags").delete().eq("category_id", category_id).execute()
    
    # 新しいタグを追加
    if tag_ids:
        category_tags = [
            {
                "id": str(uuid.uuid4()),
                "category_id": category_id,
                "tag_id": tag_id
            }
            for tag_id in tag_ids
        ]
        supabase.table("category_tags").insert(category_tags).execute()
    
    return {"status": "success", "category_id": category_id, "tag_count": len(tag_ids)}
