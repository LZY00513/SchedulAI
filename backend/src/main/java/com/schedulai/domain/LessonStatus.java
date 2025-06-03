package com.schedulai.domain;

public enum LessonStatus {
    SCHEDULED,  // 已排期，未开始
    IN_PROGRESS, // 进行中 (可选)
    COMPLETED,  // 已完成
    CANCELLED_BY_TEACHER,
    CANCELLED_BY_STUDENT,
    NO_SHOW,    // 学生未到 (可选)
    PENDING_PAYMENT, // (可选, 如果需要支付流程)
    CANCELLED
} 