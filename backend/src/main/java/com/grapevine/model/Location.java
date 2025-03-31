package com.grapevine.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "locations")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_id")
    private Long locationId;

    @Column(name = "short_name")
    @JsonProperty("short_name")
    private String shortName;

    @Column(name = "full_name")
    @JsonProperty("full_name")
    private String fullName;

    @Column(name = "maps_query")
    @JsonProperty("maps_query")
    private String mapsQuery;
}