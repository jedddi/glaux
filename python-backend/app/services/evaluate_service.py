from app.schemas.execution import (
    ConfusionMatrix,
    DatasetSummary,
    EvaluationResult,
    PerClassMetric,
)


def generate_stub_evaluation_result(
    project_id: str,
    dataset_name: str | None = None,
) -> EvaluationResult:
    classes = ["cat", "dog", "bird", "fish", "horse"]
    n_classes = len(classes)

    confusion = [
        [48, 2, 1, 0, 1],
        [3, 45, 1, 1, 2],
        [1, 0, 47, 2, 0],
        [0, 1, 2, 46, 1],
        [2, 3, 0, 1, 44],
    ]

    per_class = [
        PerClassMetric(
            class_name=cls,
            precision=confusion[i][i] / max(sum(confusion[j][i] for j in range(n_classes)), 1),
            recall=confusion[i][i] / max(sum(confusion[i]), 1),
            f1=0.0,
            support=sum(confusion[i]),
        )
        for i, cls in enumerate(classes)
    ]

    for m in per_class:
        if m.precision + m.recall > 0:
            m.f1 = 2 * (m.precision * m.recall) / (m.precision + m.recall)

    total_correct = sum(confusion[i][i] for i in range(n_classes))
    total = sum(sum(row) for row in confusion)
    accuracy = total_correct / total if total > 0 else 0.0

    avg_precision = sum(m.precision for m in per_class) / n_classes
    avg_recall = sum(m.recall for m in per_class) / n_classes
    avg_f1 = sum(m.f1 for m in per_class) / n_classes

    return EvaluationResult(
        accuracy=accuracy,
        precision=avg_precision,
        recall=avg_recall,
        f1_score=avg_f1,
        loss=0.3847,
        per_class_metrics=per_class,
        confusion_matrix=ConfusionMatrix(
            labels=classes,
            matrix=confusion,
        ),
        dataset_summary=DatasetSummary(
            sample_count=total,
            class_count=n_classes,
            class_name=dataset_name,
        ),
        warnings=[
            "Results are from a simulated evaluation run",
            "Dataset distribution may not reflect production data",
        ],
        summary=(
            f"Evaluation completed for project {project_id}. "
            f"Overall accuracy: {accuracy:.4f} across {n_classes} classes. "
            f"Model shows strongest performance on '{classes[2]}' (recall: {per_class[2].recall:.4f}) "
            f"and weakest on '{classes[4]}' (recall: {per_class[4].recall:.4f}). "
            f"Confusion between '{classes[0]}' and '{classes[1]}' suggests visual similarity."
        ),
    )
