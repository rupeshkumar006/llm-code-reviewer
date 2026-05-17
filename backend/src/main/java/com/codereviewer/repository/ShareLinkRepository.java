package com.codereviewer.repository;

import com.codereviewer.model.ShareLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ShareLinkRepository extends JpaRepository<ShareLink, Long> {

    Optional<ShareLink> findByToken(String token);

    Optional<ShareLink> findByReviewId(Long reviewId);

    void deleteByReviewId(Long reviewId);
}
