package com.codereviewer.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "review_tags")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Column(nullable = false, length = 50)
    private String tag;
}
