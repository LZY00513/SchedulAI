package com.schedulai;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // 允许访问所有路径
                        .allowedOriginPatterns("http://localhost:*") // 允许所有localhost端口
                        .allowedMethods("*") // 允许所有方法 GET POST 等
                        .allowedHeaders("*") // 允许所有请求头
                        .allowCredentials(true); // 允许携带 Cookie / 凭据
            }
        };
    }
} 