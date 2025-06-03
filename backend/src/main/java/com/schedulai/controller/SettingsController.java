package com.schedulai.controller;

import com.schedulai.dto.SystemSettingsDTO;
import com.schedulai.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private static final Logger log = LoggerFactory.getLogger(SettingsController.class);
    private final SettingsService settingsService;
    
    /**
     * 获取系统设置
     */
    @GetMapping
    public ResponseEntity<SystemSettingsDTO> getSystemSettings() {
        log.info("Fetching system settings");
        
        SystemSettingsDTO settings = settingsService.getSystemSettings();
        return ResponseEntity.ok(settings);
    }
    
    /**
     * 保存系统设置
     */
    @PostMapping
    public ResponseEntity<SystemSettingsDTO> saveSystemSettings(@RequestBody SystemSettingsDTO settingsDTO) {
        log.info("Saving system settings");
        
        SystemSettingsDTO updatedSettings = settingsService.saveSystemSettings(settingsDTO);
        return ResponseEntity.ok(updatedSettings);
    }
    
    /**
     * 重置系统设置为默认值
     */
    @PostMapping("/reset")
    public ResponseEntity<SystemSettingsDTO> resetSystemSettings() {
        log.info("Resetting system settings to default values");
        
        SystemSettingsDTO defaultSettings = settingsService.resetToDefaultSettings();
        return ResponseEntity.ok(defaultSettings);
    }
    
    /**
     * 测试OpenAI连接
     */
    @PostMapping("/test-openai")
    public ResponseEntity<String> testOpenAIConnection(@RequestBody SystemSettingsDTO settingsDTO) {
        log.info("Testing OpenAI connection");
        
        boolean success = settingsService.testOpenAIConnection(settingsDTO);
        return ResponseEntity.ok(success ? "连接成功" : "连接失败，请检查API密钥和URL设置");
    }
    
    /**
     * 测试邮件服务配置
     */
    @PostMapping("/test-email")
    public ResponseEntity<String> testEmailConfiguration(@RequestBody SystemSettingsDTO settingsDTO) {
        log.info("Testing email configuration");
        
        boolean success = settingsService.testEmailConfiguration(settingsDTO);
        return ResponseEntity.ok(success ? "邮件配置测试成功" : "邮件配置测试失败，请检查SMTP设置");
    }
} 