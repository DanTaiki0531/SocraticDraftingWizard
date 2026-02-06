from typing import List, Optional
from pydantic import BaseModel

class ResponseItem(BaseModel):
    question_id: str
    text: str
    answer: str

class GenerateRequest(BaseModel):
    category_id: str
    answers: List[ResponseItem]

class QuestionBase(BaseModel):
    id: str
    text: str
    order_index: int

class TemplateUpdate(BaseModel):
    questions: List[QuestionBase]

class GenerateResponse(BaseModel):
    markdown: str
    log_id: str

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_default: bool = False


class Tag(BaseModel):
    id: str
    name: str
    color: str


class TagCreate(BaseModel):
    name: str
    color: Optional[str] = "#8B8680"
