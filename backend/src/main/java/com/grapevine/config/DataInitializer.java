package com.grapevine.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grapevine.model.Location;
import com.grapevine.repository.LocationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initLocations(LocationRepository locationRepository) {
        return args -> {
            if (locationRepository.count() == 0) {

                //Will need to be updated to be more dynamic but this works for now
                createLocation(locationRepository, "WALC", "Wilmeth Active Learning Center", "https://www.google.com/maps/search/Wilmeth+Active+Learning+Center+Purdue+University");
                createLocation(locationRepository, "LWSN", "Lawson Computer Science Building", "https://www.google.com/maps/search/Lawson+Computer+Science+Building+Purdue+University");
                createLocation(locationRepository, "PMUC", "Purdue Memorial Union", "https://www.google.com/maps/search/Purdue+Memorial+Union+Purdue+University");
                createLocation(locationRepository, "HAMP", "Hampton Hall of Civil Engineering", "https://www.google.com/maps/search/Hampton+Hall+of+Civil+Engineering+Purdue+University");
                createLocation(locationRepository, "RAWL", "Jerry S. Rawls Hall", "https://www.google.com/maps/search/Jerry+S.+Rawls+Hall+Purdue+University");
                createLocation(locationRepository, "CHAS", "Chaney-Hale Hall of Science", "https://www.google.com/maps/search/Chaney-Hale+Hall+of+Science+Purdue+University");
                createLocation(locationRepository, "CL50", "Class of 1950 Lecture Hall", "https://www.google.com/maps/search/Class+of+1950+Lecture+Hall+Purdue+University");
                createLocation(locationRepository, "FRNY", "Forney Hall of Chemical Engineering", "https://www.google.com/maps/search/Forney+Hall+of+Chemical+Engineering+Purdue+University");
                createLocation(locationRepository, "KRAN", "Krannert Building", "https://www.google.com/maps/search/Krannert+Building+Purdue+University");
                createLocation(locationRepository, "MSEE", "Materials and Electrical Engineering Building", "https://www.google.com/maps/search/Materials+and+Electrical+Engineering+Building+Purdue+University");
                createLocation(locationRepository, "MATH", "Mathematical Sciences Building", "https://www.google.com/maps/search/Mathematical+Sciences+Building+Purdue+University");
                createLocation(locationRepository, "PHYS", "Physics Building", "https://www.google.com/maps/search/Physics+Building+Purdue+University");
                createLocation(locationRepository, "POTR", "Potter Engineering Center", "https://www.google.com/maps/search/Potter+Engineering+Center+Purdue+University");
                createLocation(locationRepository, "HAAS", "Haas Hall", "https://www.google.com/maps/search/Haas+Hall+Purdue+University");
                createLocation(locationRepository, "HIKS", "Hicks Undergraduate Library", "https://www.google.com/maps/search/Hicks+Undergraduate+Library+Purdue+University");
                createLocation(locationRepository, "BRWN", "Brown Laboratory of Chemistry", "https://www.google.com/maps/search/Brown+Laboratory+of+Chemistry+Purdue+University");
                createLocation(locationRepository, "HEAV", "Heavilon Hall", "https://www.google.com/maps/search/Heavilon+Hall+Purdue+University");
                createLocation(locationRepository, "BRNG", "Beering Hall of Liberal Arts and Education", "https://www.google.com/maps/search/Beering+Hall+of+Liberal+Arts+and+Education+Purdue+University");
                createLocation(locationRepository, "SC", "Stanley Coulter Hall", "https://www.google.com/maps/search/Stanley+Coulter+Hall+Purdue+University");
                createLocation(locationRepository, "WTHR", "Wetherill Laboratory of Chemistry", "https://www.google.com/maps/search/Wetherill+Laboratory+of+Chemistry+Purdue+University");
                createLocation(locationRepository, "UNIV", "University Hall", "https://www.google.com/maps/search/University+Hall+Purdue+University");
                createLocation(locationRepository, "YONG", "Young Hall", "https://www.google.com/maps/search/Young+Hall+Purdue+University");
                createLocation(locationRepository, "ME", "Mechanical Engineering Building", "https://www.google.com/maps/search/Mechanical+Engineering+Building+Purdue+University");
                createLocation(locationRepository, "ELLT", "Elliott Hall of Music", "https://www.google.com/maps/search/Elliott+Hall+of+Music+Purdue+University");
                createLocation(locationRepository, "PMU", "Purdue Memorial Union", "https://www.google.com/maps/search/Purdue+Memorial+Union+Purdue+University");
                createLocation(locationRepository, "STEW", "Stewart Center", "https://www.google.com/maps/search/Stewart+Center+Purdue+University");

            }
        };
    }

    private void createLocation(LocationRepository repository, String shortName, String fullName, String mapsQuery) {
        Location location = new Location();
        location.setShortName(shortName);
        location.setFullName(fullName);
        location.setMapsQuery(mapsQuery);
        repository.save(location);
    }
}


