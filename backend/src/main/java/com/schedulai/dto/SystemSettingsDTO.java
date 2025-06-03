package com.schedulai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SystemSettingsDTO {
    // 系统基本设置
    private String systemName;
    private String timeZone;
    private String dateFormat;
    private String timeFormat;
    
    // 外观设置
    private String theme;
    private Boolean darkMode;
    
    // OpenAI API设置
    private String openaiApiKey;
    private String openaiApiUrl;
    private String openaiModel;
    
    // 邮件通知设置
    private Boolean emailNotification;
    private String smtpServer;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpPassword;
    private String senderEmail;
    
    // 数据设置
    private Integer dataRetentionDays;
    private String backupPath;
} 