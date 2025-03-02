
package com.grapevine.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ratings")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rating_id")
    private Long ratingId;

    @Column(name = "average_rating")
    private Float averageRating = 0.0f;

    @ElementCollection
    @CollectionTable(
            name = "rating_scores",
            joinColumns = @JoinColumn(name = "rating_id")
    )
    @Column(name = "score")
    private List<Float> scores = new ArrayList<>();

    @ElementCollection
    @CollectionTable(
            name = "rating_reviews",
            joinColumns = @JoinColumn(name = "rating_id")
    )
    @Column(name = "review", columnDefinition = "TEXT")
    private List<String> reviews = new ArrayList<>();

    @OneToOne(mappedBy = "rating")
    private Group group;

    public void addRating(Float score, String review) {
        scores.add(score);
        reviews.add(review);
        recalculateAverageRating();
    }

    private void recalculateAverageRating() {
        if (scores.isEmpty()) {
            this.averageRating = 0.0f;
            return;
        }

        float sum = 0;
        for (Float score : scores) {
            sum += score;
        }
        this.averageRating = sum / scores.size();
    }
}