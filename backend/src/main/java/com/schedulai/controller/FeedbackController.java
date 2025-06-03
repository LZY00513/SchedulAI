package com.schedulai.controller;

import com.schedulai.dto.FeedbackDTO;
import com.schedulai.service.FeedbackService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {
    
    private static final Logger log = LoggerFactory.getLogger(FeedbackController.class);
    private final FeedbackService feedbackService;
    
    /**
     * 获取指定课程的所有评价
     */
    @GetMapping("/lesson/{lessonId}")
    public ResponseEntity<List<FeedbackDTO>> getLessonFeedbacks(@PathVariable Long lessonId) {
        log.info("获取课程(ID: {})的评价", lessonId);
        List<FeedbackDTO> feedbacks = feedbackService.getLessonFeedbacks(lessonId);
        return ResponseEntity.ok(feedbacks);
    }
    
    /**
     * 获取指定学生的所有评价
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<FeedbackDTO>> getStudentFeedbacks(@PathVariable Long studentId) {
        log.info("获取学生(ID: {})的评价", studentId);
        List<FeedbackDTO> feedbacks = feedbackService.getStudentFeedbacks(studentId);
        return ResponseEntity.ok(feedbacks);
    }
    
    /**
     * 创建或更新评价
     */
    @PostMapping
    public ResponseEntity<?> createOrUpdateFeedback(@RequestBody FeedbackDTO feedbackDTO) {
        log.info("创建/更新评价: {}", feedbackDTO);
        try {
            FeedbackDTO savedFeedback = feedbackService.createOrUpdateFeedback(feedbackDTO);
            return ResponseEntity.ok(savedFeedback);
        } catch (EntityNotFoundException e) {
            log.error("创建/更新评价失败: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("创建/更新评价失败: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "创建/更新评价失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * 删除评价
     */
    @DeleteMapping("/{feedbackId}")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long feedbackId) {
        log.info("删除评价(ID: {})", feedbackId);
        try {
            feedbackService.deleteFeedback(feedbackId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("删除评价失败: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "删除评价失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
} 