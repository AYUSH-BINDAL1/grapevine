package com.grapevine.service;

import com.grapevine.model.Course;
import com.grapevine.repository.CourseRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {
    private final CourseRepository courseRepository;

    public List<Course> getAllCourses() { // sorted by subject + course number
        return courseRepository.findAll(
                Sort.by(Sort.Direction.ASC, "subject")
                        .and(Sort.by(Sort.Direction.ASC, "courseNumber"))
        );
    }

    public Optional<Course> getCourseByKey(String courseKey) {
        return courseRepository.findById(courseKey);
    }

    public List<CourseRepository.ShortCourse> getAllShortCourses() {
        return courseRepository.findAllShortCourses();
    }

    public Optional<CourseRepository.ShortCourse> getShortCourse(String courseKey) {
        return courseRepository.findShortCourseByCourseKey(courseKey);
    }

    public List<Course> searchCoursesByRegex(String query) {
        // escape special regex characters to treat the input as a literal string
        String escapedQuery = Pattern.quote(query);
        // create case-insensitive regex pattern
        Pattern pattern = Pattern.compile(".*" + escapedQuery + ".*", Pattern.CASE_INSENSITIVE);

        return courseRepository.findAll().stream()
                .filter(course -> pattern.matcher(course.getCourseKey()).matches())
                .collect(Collectors.toList());
    }

    public List<CourseRepository.ShortCourse> searchShortCoursesByRegex(String query) {
        String escapedQuery = Pattern.quote(query);

        Pattern pattern = Pattern.compile(".*" + escapedQuery + ".*", Pattern.CASE_INSENSITIVE);

        return getAllShortCourses().stream()
                .filter(course -> pattern.matcher(course.getCourseKey()).matches() ||
                        (course.getTitle() != null && pattern.matcher(course.getTitle()).matches()))
                .collect(Collectors.toList());
    }

    @PostConstruct
    public void loadCoursesFromCsv() {
        try {
            ClassPathResource resource = new ClassPathResource("purdue_fall_2024.csv");
            BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream()));

            String line;
            Map<String, Course> coursesMap = new HashMap<>();
            String currentSubject = null;
            String currentSubjectDesc = null;

            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",", -1); // -1 to keep empty trailing fields

                // Handle empty fields with appropriate logic
                if (parts.length >= 6) {
                    String subject = parts[0].trim();
                    String subjectDesc = parts[1].trim();
                    String courseNumber = parts[2].trim();
                    String title = parts[3].trim();
                    String academicPeriod = parts[4].trim();
                    String crn = parts[5].trim();

                    // Maintain context between rows
                    if (!subject.isEmpty()) {
                        currentSubject = subject;
                    }

                    if (!subjectDesc.isEmpty()) {
                        currentSubjectDesc = subjectDesc;
                    }

                    if (!courseNumber.isEmpty()) {
                        // Create a unique key for the course
                        String courseKey = currentSubject + courseNumber;

                        // Check if we already have this course in our map
                        Course course = coursesMap.get(courseKey);

                        if (course == null) {
                            // Create a new course
                            course = new Course();
                            course.setCourseKey(courseKey);
                            course.setSubject(currentSubject);
                            course.setSubjectDesc(currentSubjectDesc);
                            course.setCourseNumber(courseNumber);
                            course.setTitle(title);
                            course.setAcademicPeriod(academicPeriod);
                            course.setCrns(new ArrayList<>());
                            coursesMap.put(courseKey, course);
                        }

                        // Add CRN if it exists
                        if (!crn.isEmpty()) {
                            course.getCrns().add(crn);
                        }
                    } else if (!crn.isEmpty()) {
                        // This is an additional CRN for the last course
                        String lastCourseKey = findLastCourseKey(coursesMap);
                        if (lastCourseKey != null) {
                            Course lastCourse = coursesMap.get(lastCourseKey);
                            if (lastCourse != null) {
                                lastCourse.getCrns().add(crn);
                            }
                        }
                    }
                }
            }

            // Save all courses to the repository
            courseRepository.saveAll(coursesMap.values());

            reader.close();
            System.out.println("Loaded " + coursesMap.size() + " courses from CSV");
        } catch (IOException e) {
            System.err.println("Error loading courses from CSV: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private String findLastCourseKey(Map<String, Course> coursesMap) {
        if (coursesMap.isEmpty()) {
            return null;
        }
        // Get the last key added to the map
        return coursesMap.keySet().stream().reduce((first, second) -> second).orElse(null);
    }
}