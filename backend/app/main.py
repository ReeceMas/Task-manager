from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas
from .database import engine, get_db, Base
from .processes import router as processes_router

Base.metadata.create_all(bind=engine)  # swap for Alembic migrations later

app = FastAPI(title="Task Manager")
app.include_router(processes_router)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/tasks", response_model=list[schemas.TaskOut])
def list_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).order_by(models.Task.id).all()

@app.post("/api/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(body: schemas.TaskCreate, db: Session = Depends(get_db)):
    task = models.Task(title=body.title)
    db.add(task); db.commit(); db.refresh(task)
    return task

@app.patch("/api/tasks/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, body: schemas.TaskUpdate, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    db.commit(); db.refresh(task)
    return task

@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.get(models.Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    db.delete(task); db.commit()