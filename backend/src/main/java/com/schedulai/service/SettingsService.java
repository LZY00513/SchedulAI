package com.schedulai.service;

import com.schedulai.dto.SystemSettingsDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.io.*;
import java.util.Collections;
import java.util.Map;
import java.util.Properties;
import java.util.TimeZone;

@Service
public class SettingsService {

    private static final Logger log = LoggerFactory.getLogger(SettingsService.class);
    
    // 配置文件路径
    private static final String CONFIG_PATH = "config/application-custom.properties";
    
    @Value("${spring.application.name:SchedulAI}")
    private String defaultSystemName;
    
    @Value("${openai.api.key:}")
    private String defaultOpenaiApiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String defaultOpenaiApiUrl;
    
    @Value("${openai.model:gpt-3.5-turbo}")
    private String defaultOpenaiModel;
    
    /**
     * 获取系统设置
     */
    @Transactional(readOnly = true)
    public SystemSettingsDTO getSystemSettings() {
        log.info("Fetching system settings");
        
        // 尝试从配置文件加载设置
        Properties props = loadProperties();
        
        // 创建设置DTO对象
        SystemSettingsDTO settings = new SystemSettingsDTO();
        
        // 基本设置
        settings.setSystemName(props.getProperty("system.name", defaultSystemName));
        settings.setTimeZone(props.getProperty("system.timezone", TimeZone.getDefault().getID()));
        settings.setDateFormat(props.getProperty("system.dateFormat", "yyyy-MM-dd"));
        settings.setTimeFormat(props.getProperty("system.timeFormat", "HH:mm:ss"));
        
        // 外观设置
        settings.setTheme(props.getProperty("system.theme", "light"));
        settings.setDarkMode(Boolean.parseBoolean(props.getProperty("system.darkMode", "false")));
        
        // OpenAI API设置
        settings.setOpenaiApiKey(props.getProperty("openai.api.key", defaultOpenaiApiKey));
        settings.setOpenaiApiUrl(props.getProperty("openai.api.url", defaultOpenaiApiUrl));
        settings.setOpenaiModel(props.getProperty("openai.model", defaultOpenaiModel));
        
        // 邮件通知设置
        settings.setEmailNotification(Boolean.parseBoolean(props.getProperty("email.notification", "false")));
        settings.setSmtpServer(props.getProperty("email.smtp.server", ""));
        settings.setSmtpPort(Integer.parseInt(props.getProperty("email.smtp.port", "587")));
        settings.setSmtpUsername(props.getProperty("email.smtp.username", ""));
        settings.setSmtpPassword(props.getProperty("email.smtp.password", ""));
        settings.setSenderEmail(props.getProperty("email.sender", ""));
        
        // 数据设置
        settings.setDataRetentionDays(Integer.parseInt(props.getProperty("data.retention.days", "365")));
        settings.setBackupPath(props.getProperty("data.backup.path", "./backup"));
        
        return settings;
    }
    
    /**
     * 保存系统设置
     */
    @Transactional
    public SystemSettingsDTO saveSystemSettings(SystemSettingsDTO settingsDTO) {
        log.info("Saving system settings");
        
        // 加载原有配置
        Properties props = loadProperties();
        
        // 更新配置
        updateProperties(props, settingsDTO);
        
        // 保存配置文件
        saveProperties(props);
        
        return settingsDTO;
    }
    
    /**
     * 重置为默认设置
     */
    @Transactional
    public SystemSettingsDTO resetToDefaultSettings() {
        log.info("Resetting to default settings");
        
        SystemSettingsDTO defaultSettings = new SystemSettingsDTO();
        
        // 基本设置
        defaultSettings.setSystemName(defaultSystemName);
        defaultSettings.setTimeZone(TimeZone.getDefault().getID());
        defaultSettings.setDateFormat("yyyy-MM-dd");
        defaultSettings.setTimeFormat("HH:mm:ss");
        
        // 外观设置
        defaultSettings.setTheme("light");
        defaultSettings.setDarkMode(false);
        
        // OpenAI API设置
        defaultSettings.setOpenaiApiKey(defaultOpenaiApiKey);
        defaultSettings.setOpenaiApiUrl(defaultOpenaiApiUrl);
        defaultSettings.setOpenaiModel(defaultOpenaiModel);
        
        // 邮件通知设置
        defaultSettings.setEmailNotification(false);
        defaultSettings.setSmtpServer("");
        defaultSettings.setSmtpPort(587);
        defaultSettings.setSmtpUsername("");
        defaultSettings.setSmtpPassword("");
        defaultSettings.setSenderEmail("");
        
        // 数据设置
        defaultSettings.setDataRetentionDays(365);
        defaultSettings.setBackupPath("./backup");
        
        // 保存默认设置
        Properties props = new Properties();
        updateProperties(props, defaultSettings);
        saveProperties(props);
        
        return defaultSettings;
    }
    
    /**
     * 测试OpenAI连接
     */
    public boolean testOpenAIConnection(SystemSettingsDTO settingsDTO) {
        log.info("Testing OpenAI connection with API URL: {}", settingsDTO.getOpenaiApiUrl());
        
        try {
            // 构建测试请求
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(settingsDTO.getOpenaiApiKey());
            
            Map<String, Object> requestBody = Map.of(
                "model", settingsDTO.getOpenaiModel(),
                "messages", Collections.singletonList(
                    Map.of("role", "user", "content", "Hello")),
                "max_tokens", 5
            );
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            // 设置超时时间（5秒）
            RestTemplate restTemplate = new RestTemplate();
            
            // 发送请求
            ResponseEntity<Map> response = restTemplate.postForEntity(
                settingsDTO.getOpenaiApiUrl(), request, Map.class);
            
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("Error testing OpenAI connection: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * 测试邮件配置 - 简化版，不实际连接邮件服务器
     */
    public boolean testEmailConfiguration(SystemSettingsDTO settingsDTO) {
        log.info("Testing email configuration for SMTP server: {}", settingsDTO.getSmtpServer());
        
        if (!settingsDTO.getEmailNotification() || 
            settingsDTO.getSmtpServer() == null || 
            settingsDTO.getSmtpServer().isEmpty()) {
            return false;
        }
        
        try {
            // 基本验证，不实际连接
            boolean hasRequiredFields = settingsDTO.getSmtpServer() != null && 
                                      !settingsDTO.getSmtpServer().isEmpty() &&
                                      settingsDTO.getSmtpPort() != null && 
                                      settingsDTO.getSmtpPort() > 0 &&
                                      settingsDTO.getSmtpUsername() != null && 
                                      !settingsDTO.getSmtpUsername().isEmpty() &&
                                      settingsDTO.getSmtpPassword() != null && 
                                      !settingsDTO.getSmtpPassword().isEmpty() &&
                                      settingsDTO.getSenderEmail() != null && 
                                      !settingsDTO.getSenderEmail().isEmpty();
            
            // 只验证邮件地址格式
            boolean validEmail = settingsDTO.getSenderEmail() != null && 
                               settingsDTO.getSenderEmail().matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$");
            
            return hasRequiredFields && validEmail;
        } catch (Exception e) {
            log.error("Error validating email configuration: {}", e.getMessage());
            return false;
        }
    }
    
    // --- 私有辅助方法 ---
    
    /**
     * 加载配置文件
     */
    private Properties loadProperties() {
        Properties props = new Properties();
        
        try {
            File configFile = new File(CONFIG_PATH);
            
            if (configFile.exists()) {
                try (FileInputStream fis = new FileInputStream(configFile)) {
                    props.load(fis);
                }
            } else {
                log.info("Configuration file not found, will use default settings");
            }
        } catch (IOException e) {
            log.error("Error loading configuration: {}", e.getMessage());
        }
        
        return props;
    }
    
    /**
     * 从DTO更新配置
     */
    private void updateProperties(Properties props, SystemSettingsDTO settings) {
        // 基本设置
        props.setProperty("system.name", settings.getSystemName());
        props.setProperty("system.timezone", settings.getTimeZone());
        props.setProperty("system.dateFormat", settings.getDateFormat());
        props.setProperty("system.timeFormat", settings.getTimeFormat());
        
        // 外观设置
        props.setProperty("system.theme", settings.getTheme());
        props.setProperty("system.darkMode", String.valueOf(settings.getDarkMode()));
        
        // OpenAI API设置
        props.setProperty("openai.api.key", settings.getOpenaiApiKey());
        props.setProperty("openai.api.url", settings.getOpenaiApiUrl());
        props.setProperty("openai.model", settings.getOpenaiModel());
        
        // 邮件通知设置
        props.setProperty("email.notification", String.valueOf(settings.getEmailNotification()));
        props.setProperty("email.smtp.server", settings.getSmtpServer());
        props.setProperty("email.smtp.port", String.valueOf(settings.getSmtpPort()));
        props.setProperty("email.smtp.username", settings.getSmtpUsername());
        props.setProperty("email.smtp.password", settings.getSmtpPassword());
        props.setProperty("email.sender", settings.getSenderEmail());
        
        // 数据设置
        props.setProperty("data.retention.days", String.valueOf(settings.getDataRetentionDays()));
        props.setProperty("data.backup.path", settings.getBackupPath());
    }
    
    /**
     * 保存配置文件
     */
    private void saveProperties(Properties props) {
        try {
            File configDir = new File("config");
            if (!configDir.exists()) {
                configDir.mkdirs();
            }
            
            File configFile = new File(CONFIG_PATH);
            
            try (FileOutputStream fos = new FileOutputStream(configFile)) {
                props.store(fos, "SchedulAI Custom Configuration");
            }
            
            log.info("Settings saved to configuration file: {}", configFile.getAbsolutePath());
        } catch (IOException e) {
            log.error("Error saving configuration: {}", e.getMessage());
        }
    }
} 