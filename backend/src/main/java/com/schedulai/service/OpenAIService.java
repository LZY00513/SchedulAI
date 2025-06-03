package com.schedulai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.schedulai.dto.ProposedLessonDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
public class OpenAIService {

    private static final Logger log = LoggerFactory.getLogger(OpenAIService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    // Consider adding model name to properties as well
    @Value("${openai.model:gpt-4}") // Default to gpt-4 if not specified
    private String model;

    public OpenAIService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        // Configure Jackson for Java Time API and ignore unknown properties
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }

    public List<ProposedLessonDTO> getScheduleRecommendations(String prompt) {
        log.info("Sending request to OpenAI API for schedule recommendations. Prompt length: {}", prompt.length());
        log.debug("Prompt content for scheduling:\n{}", prompt); // Log full prompt only in debug mode

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", "You are an intelligent course scheduling assistant. Respond ONLY with a valid JSON array of proposed lessons, adhering strictly to the format provided in the user prompt. Do not include any introductory text, explanations, or markdown formatting."),
                        Map.of("role", "user", "content", prompt)
                ),
                "max_tokens", 1500, // Increased max_tokens significantly
                "temperature", 0.5 // Lower temperature might give more predictable results
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            log.info("Received response from OpenAI API. Status: {}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null) {
                        String reply = (String) message.get("content");
                        if (reply != null && !reply.isBlank()) {
                            log.debug("OpenAI raw reply for scheduling: {}", reply);
                            // Clean potential markdown code fences
                            String cleanedReply = reply.trim().replace("```json", "").replace("```", "").trim();
                            return parseResponse(cleanedReply);
                        }
                    }
                }
                 log.warn("OpenAI schedule response did not contain expected structure.");
                 log.debug("Full OpenAI response body: {}", response.getBody());
            } else {
                 log.error("OpenAI API call failed with status: {}", response.getStatusCode());
                 log.debug("Full OpenAI response body: {}", response.getBody());
            }
        } catch (HttpClientErrorException e) {
            log.error("HTTP error calling OpenAI API: {} - {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Error calling or processing OpenAI API response: {}", e.getMessage(), e);
        }

        return Collections.emptyList();
    }

    public String generateTextCompletion(String systemMessage, String userPrompt) {
        log.info("Sending request to OpenAI API for text completion. Prompt length: {}", userPrompt.length());
        log.debug("System Message: {}\nUser Prompt:\n{}", systemMessage, userPrompt);

        Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemMessage),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "max_tokens", 2000, // 增加为2000以确保有足够的空间返回完整JSON
                "temperature", 0.5  // 降低温度以获得更精确的结果
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            log.info("Received response from OpenAI API for text completion. Status: {}", response.getStatusCode());

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    if (message != null) {
                        String reply = (String) message.get("content");
                        if (reply != null && !reply.isBlank()) {
                            log.debug("OpenAI raw text completion reply: {}", reply);
                            // 清除可能的Markdown代码围栏和其他非JSON内容
                            String cleanedReply = reply.trim();
                            // 提取JSON部分 - 查找第一个[和最后一个]之间的内容
                            int startIdx = cleanedReply.indexOf('[');
                            int endIdx = cleanedReply.lastIndexOf(']');
                            
                            if (startIdx >= 0 && endIdx > startIdx) {
                                cleanedReply = cleanedReply.substring(startIdx, endIdx + 1);
                                log.debug("Extracted JSON array: {}", cleanedReply);
                            } else {
                                // 如果找不到JSON数组标记，尝试清除常见的Markdown格式
                                cleanedReply = cleanedReply
                                    .replace("```json", "")
                                    .replace("```", "")
                                    .trim();
                            }
                            return cleanedReply;
                        }
                    }
                }
                log.warn("OpenAI text completion response did not contain expected structure.");
                log.debug("Full OpenAI response body: {}", response.getBody());
            } else {
                log.error("OpenAI API call for text completion failed with status: {}", response.getStatusCode());
                log.debug("Full OpenAI response body: {}", response.getBody());
            }
        } catch (HttpClientErrorException e) {
            log.error("HTTP error calling OpenAI API for text completion: {} - {}", e.getStatusCode(), e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.error("Error calling or processing OpenAI API response for text completion: {}", e.getMessage(), e);
        }

        return "[]"; // 返回空数组而不是null，确保解析不会失败
    }

    private List<ProposedLessonDTO> parseResponse(String jsonResponse) {
        try {
            // Log the raw response before parsing, especially useful for debugging
            log.debug("Attempting to parse JSON response: {}", jsonResponse);
            return objectMapper.readValue(jsonResponse, new TypeReference<List<ProposedLessonDTO>>() {});
        } catch (Exception e) {
            // Log the actual response string in the error message
            log.error("Failed to parse OpenAI JSON response: {}. Response was: {}", e.getMessage(), jsonResponse, e);
            return Collections.emptyList();
        }
    }
} 