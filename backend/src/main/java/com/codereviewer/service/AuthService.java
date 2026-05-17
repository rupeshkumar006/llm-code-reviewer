package com.codereviewer.service;

import com.codereviewer.dto.AuthRequest;
import com.codereviewer.dto.AuthResponse;
import com.codereviewer.model.User;
import com.codereviewer.repository.UserRepository;
import com.codereviewer.security.JwtTokenProvider;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .displayName(request.getDisplayName() != null ?
                        request.getDisplayName() : request.getEmail().split("@")[0])
                .role(User.Role.FREE)
                .provider(User.AuthProvider.LOCAL)
                .build();

        // Generate refresh token
        String refreshToken = tokenProvider.generateRefreshToken();
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        // Generate access token
        String accessToken = tokenProvider.generateAccessToken(user.getEmail());

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken = tokenProvider.generateAccessToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken();

        // Update refresh token
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        User user = userRepository.findByRefreshToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        String newAccessToken = tokenProvider.generateAccessToken(user.getEmail());
        String newRefreshToken = tokenProvider.generateRefreshToken();

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    @Transactional
    public AuthResponse handleGoogleOAuth(String email, String name, String picture) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            // Auto-create account for first-time Google login
            user = User.builder()
                    .email(email)
                    .displayName(name)
                    .profilePicture(picture)
                    .role(User.Role.FREE)
                    .provider(User.AuthProvider.GOOGLE)
                    .build();
        } else {
            // Update profile info from Google
            user.setDisplayName(name);
            user.setProfilePicture(picture);
        }

        String refreshToken = tokenProvider.generateRefreshToken();
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(user.getEmail());
        return buildAuthResponse(user, accessToken, refreshToken);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getAccessTokenExpiration() / 1000)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .displayName(user.getDisplayName())
                        .profilePicture(user.getProfilePicture())
                        .role(user.getRole().name())
                        .build())
                .build();
    }
}
