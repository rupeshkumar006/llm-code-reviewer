package com.codereviewer.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
    private String code;

    @Column(name = "review_result", columnDefinition = "MEDIUMTEXT")
    private String reviewResult; // full AI JSON response stored as text

    @Column
    private Integer score;

    @Column(name = "bug_count")
    @Builder.Default
    private Integer bugCount = 0;

    @Column(length = 255)
    private String label;

    @Column
    @Builder.Default
    private Boolean favourite = false;

    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<ReviewTag> tags = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
