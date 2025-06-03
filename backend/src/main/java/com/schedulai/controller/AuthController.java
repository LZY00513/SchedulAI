package com.schedulai.controller;

import com.schedulai.domain.User;
import com.schedulai.domain.UserRole;
import com.schedulai.dto.AuthResponseDTO;
import com.schedulai.dto.LoginRequestDTO;
import com.schedulai.dto.RegisterRequestDTO;
import com.schedulai.dto.UserDTO;
import com.schedulai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequestDTO registerRequest) {
        log.info("注册请求: username={}, role={}, name={}", 
                registerRequest.getUsername(), 
                registerRequest.getRole(),
                registerRequest.getName());
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // 提前检查用户名是否已存在
            if (authService.checkUsernameExists(registerRequest.getUsername())) {
                log.warn("注册失败: 用户名已存在 {}", registerRequest.getUsername());
                response.put("success", false);
                response.put("error", "用户名已存在");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 提前检查邮箱是否已存在
            if (registerRequest.getEmail() != null && !registerRequest.getEmail().isEmpty() 
                    && authService.checkEmailExists(registerRequest.getEmail())) {
                log.warn("注册失败: 邮箱已被注册 {}", registerRequest.getEmail());
                response.put("success", false);
                response.put("error", "邮箱已被注册");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 验证必要字段
            if (!StringUtils.hasText(registerRequest.getUsername())) {
                log.error("注册失败: 用户名为空");
                response.put("success", false);
                response.put("error", "用户名不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!StringUtils.hasText(registerRequest.getPassword())) {
                log.error("注册失败: 密码为空");
                response.put("success", false);
                response.put("error", "密码不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!StringUtils.hasText(registerRequest.getName())) {
                log.error("注册失败: 姓名为空");
                response.put("success", false);
                response.put("error", "姓名不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!StringUtils.hasText(registerRequest.getEmail())) {
                log.error("注册失败: 邮箱为空");
                response.put("success", false);
                response.put("error", "邮箱不能为空");
                return ResponseEntity.badRequest().body(response);
            }
            
            // 如果是学生角色，检查额外字段
            if (registerRequest.getRole() == UserRole.STUDENT) {
                log.info("学生注册: 家长姓名={}, 家长电话={}, 地址={}", 
                        registerRequest.getParentName(), 
                        registerRequest.getParentPhone(),
                        registerRequest.getAddress());
                
                // 记录其他字段
                log.debug("学生注册详情: grade={}, notes={}",
                        registerRequest.getGrade(),
                        registerRequest.getNotes());
            }
            
            // 调用服务处理注册
            AuthResponseDTO authResponse = authService.register(registerRequest);
            log.info("注册成功: username={}, userId={}", 
                    registerRequest.getUsername(), 
                    authResponse.getUser() != null ? authResponse.getUser().getId() : "unknown");
            
            // 构建成功响应
            response.put("success", true);
            response.put("message", "注册成功");
            response.put("user", authResponse.getUser());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("注册失败 - 业务逻辑错误: {}", e.getMessage());
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.badRequest().body(response);
        } catch (DataIntegrityViolationException e) {
            // 特殊处理数据一致性错误（如唯一键约束）
            log.error("注册失败 - 数据一致性错误: {}", e.getMessage());
            
            // 检查是否是用户名重复错误
            if (e.getMessage().contains("Duplicate entry") && e.getMessage().contains("UKr43af9ap4edm43mmtq01oddj6")) {
                response.put("success", false);
                response.put("error", "用户名已存在");
            } else {
                response.put("success", false);
                response.put("error", "数据校验失败: 可能存在重复的用户名或邮箱");
            }
            
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("注册失败 - 未预期错误: ", e);
            
            response.put("success", false);
            response.put("error", "服务器内部错误: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        log.info("登录请求: username={}, role={}", loginRequest.getUsername(), loginRequest.getRole());
        
        try {
            // 基础验证
            if (loginRequest.getUsername() == null || loginRequest.getUsername().isEmpty()) {
                log.error("登录失败: 用户名为空");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "用户名不能为空"
                ));
            }
            
            if (loginRequest.getPassword() == null || loginRequest.getPassword().isEmpty()) {
                log.error("登录失败: 密码为空");
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "密码不能为空"
                ));
            }
            
            // 检查角色值，确保有效
            if (loginRequest.getRole() != null) {
                try {
                    // 确保角色值是有效的枚举值
                    UserRole roleValue = loginRequest.getRole();
                    log.info("角色验证成功: {}", roleValue);
                } catch (Exception e) {
                    log.error("角色值无效: {}", loginRequest.getRole());
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "无效的角色值"
                    ));
                }
            }
            
            try {
                // 使用AuthService的login方法，获取真实的用户信息
                AuthResponseDTO authResponse = authService.login(loginRequest);
                
                // 构建响应
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "登录成功");
                response.put("user", authResponse.getUser());
                
                log.info("用户 {} 登录成功，角色: {}", authResponse.getUser().getUsername(), authResponse.getUser().getRole());
                
                return ResponseEntity.ok(response);
            } catch (IllegalArgumentException e) {
                log.error("登录失败 - 业务异常: {}", e.getMessage());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
                ));
            } catch (AuthenticationException e) {
                log.error("登录失败 - 认证异常: {}", e.getMessage());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "用户名或密码错误"
                ));
            }
        } catch (Exception e) {
            log.error("登录失败 - 未预期异常: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "服务器内部错误",
                "error", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        SecurityContextHolder.clearContext();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "退出成功");
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/check-username")
    public ResponseEntity<Boolean> checkUsernameExists(@RequestParam String username) {
        log.info("检查用户名是否存在: {}", username);
        
        Boolean exists = authService.checkUsernameExists(username);
        return ResponseEntity.ok(exists);
    }
    
    @PostMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(@RequestParam String email) {
        log.info("检查邮箱是否已存在: {}", email);
        boolean exists = authService.checkEmailExists(email);
        log.info("邮箱 {} 是否存在: {}", email, exists);
        return ResponseEntity.ok(exists);
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, Object> requestData) {
        log.info("密码重置请求: username={}", requestData.get("username"));
        
        try {
            // 验证请求数据
            String username = (String) requestData.get("username");
            if (username == null || username.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "用户名不能为空"
                ));
            }
            
            // 验证身份信息
            // 至少需要检查3项信息进行身份验证
            int matchCount = 0;
            Map<String, Object> verificationData = new HashMap<>();
            
            // 尝试获取验证字段
            String name = (String) requestData.get("name");
            String email = (String) requestData.get("email");
            String phone = (String) requestData.get("phone");
            String grade = (String) requestData.get("grade");
            String parentName = (String) requestData.get("parentName");
            String parentPhone = (String) requestData.get("parentPhone");
            String address = (String) requestData.get("address");
            
            // 检查用户存在性
            if (!authService.checkUsernameExists(username)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "用户不存在"
                ));
            }
            
            // 获取用户信息进行比对
            User user = authService.getUserByUsername(username);
            
            // 检查姓名
            if (name != null && !name.isEmpty() && name.equals(user.getName())) {
                matchCount++;
                verificationData.put("name", true);
            }
            
            // 检查邮箱
            if (email != null && !email.isEmpty() && email.equals(user.getEmail())) {
                matchCount++;
                verificationData.put("email", true);
            }
            
            // 检查电话
            if (phone != null && !phone.isEmpty() && phone.equals(user.getPhone())) {
                matchCount++;
                verificationData.put("phone", true);
            }
            
            // 如果是学生，检查额外字段
            if (user.getRole() == UserRole.STUDENT) {
                // 检查年级
                if (grade != null && !grade.isEmpty() && grade.equals(user.getGrade())) {
                    matchCount++;
                    verificationData.put("grade", true);
                }
                
                // 检查家长姓名
                if (parentName != null && !parentName.isEmpty() && parentName.equals(user.getParentName())) {
                    matchCount++;
                    verificationData.put("parentName", true);
                }
                
                // 检查家长电话
                if (parentPhone != null && !parentPhone.isEmpty() && parentPhone.equals(user.getParentPhone())) {
                    matchCount++;
                    verificationData.put("parentPhone", true);
                }
                
                // 检查地址
                if (address != null && !address.isEmpty() && address.equals(user.getAddress())) {
                    matchCount++;
                    verificationData.put("address", true);
                }
            }
            
            // 判断是否至少匹配了3项信息
            if (matchCount < 3) {
                log.warn("用户 {} 身份验证失败: 只匹配了 {} 项信息", username, matchCount);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "身份验证失败，请提供更多准确的信息",
                    "matchCount", matchCount
                ));
            }
            
            // 身份验证成功，重置密码为默认密码123456
            String defaultPassword = "123456";
            authService.updatePassword(username, defaultPassword);
            
            log.info("用户 {} 密码重置成功", username);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "身份验证成功，密码已重置",
                "defaultPassword", defaultPassword
            ));
            
        } catch (Exception e) {
            log.error("密码重置过程中发生错误: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "服务器内部错误: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> requestData) {
        log.info("修改密码请求: username={}", requestData.get("username"));
        
        try {
            // 验证请求数据
            String username = requestData.get("username");
            String oldPassword = requestData.get("oldPassword");
            String newPassword = requestData.get("newPassword");
            
            if (username == null || username.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "用户名不能为空"
                ));
            }
            
            if (oldPassword == null || oldPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "当前密码不能为空"
                ));
            }
            
            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "新密码不能为空"
                ));
            }
            
            // 验证旧密码
            LoginRequestDTO loginRequest = new LoginRequestDTO();
            loginRequest.setUsername(username);
            loginRequest.setPassword(oldPassword);
            
            try {
                // 尝试验证当前密码
                authService.validateCredentials(username, oldPassword);
                
                // 验证成功，更新密码
                authService.updatePassword(username, newPassword);
                
                log.info("用户 {} 密码修改成功", username);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "密码修改成功"
                ));
            } catch (Exception e) {
                log.error("密码验证失败: {}", e.getMessage());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "当前密码不正确"
                ));
            }
        } catch (Exception e) {
            log.error("修改密码过程中发生错误: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "服务器内部错误: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/create-admin")
    public ResponseEntity<?> createAdmin() {
        log.info("创建管理员账号");
        
        // 检查是否已存在admin用户
        if (authService.checkUsernameExists("admin")) {
            log.info("管理员账号已存在");
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "管理员账号已存在");
            return ResponseEntity.ok(response);
        }
        
        // 创建admin用户
        RegisterRequestDTO adminRequest = new RegisterRequestDTO();
        adminRequest.setUsername("admin");
        adminRequest.setPassword("admin123");
        adminRequest.setName("系统管理员");
        adminRequest.setEmail("admin@schedulai.com");
        adminRequest.setRole(UserRole.ADMIN);
        
        try {
            AuthResponseDTO result = authService.register(adminRequest);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "管理员账号创建成功");
            response.put("user", result.getUser());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("创建管理员账号失败", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("error", "创建管理员账号失败: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
} 