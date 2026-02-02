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
