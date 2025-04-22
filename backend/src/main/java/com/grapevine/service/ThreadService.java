package com.grapevine.service;

import com.grapevine.model.Comment;
import com.grapevine.model.Thread;
import com.grapevine.model.User;
import com.grapevine.repository.ThreadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ThreadService {

    private final ThreadRepository threadRepository;

    @Autowired
    public ThreadService(ThreadRepository threadRepository) {
        this.threadRepository = threadRepository;
    }

    public List<Thread> getAllThreads() {
        // Updated to return threads sorted by timestamp (newest first)
        return threadRepository.findAllByOrderByCreatedAtDesc();
    }

    public Thread getThreadById(Long id) {
        return threadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found with id: " + id));
    }

    public List<Thread> getThreadsByAuthor(String authorEmail) {
        // Updated to return author's threads sorted by timestamp (newest first)
        return threadRepository.findByAuthorEmailOrderByCreatedAtDesc(authorEmail);
    }

    public Thread createThread(Thread thread) {
        return threadRepository.save(thread);
    }

    public Thread updateThread(Long id, Thread threadDetails) {
        Thread thread = getThreadById(id);
        thread.setTitle(threadDetails.getTitle());
        thread.setDescription(threadDetails.getDescription());
        return threadRepository.save(thread);
    }

    public void deleteThread(Long id) {
        Thread thread = getThreadById(id);
        threadRepository.delete(thread);
    }

    public Thread addComment(Long threadId, Comment comment) {
        Thread thread = getThreadById(threadId);
        comment.setThread(thread);
        thread.getComments().add(comment);
        return threadRepository.save(thread);
    }

    public Thread upvoteThread(Long id, String userEmail) {
        Thread thread = getThreadById(id);
        Integer currentVote = thread.getVotes().getOrDefault(userEmail, 0);

        // Update vote count based on previous vote
        if (currentVote == 1) {
            // Remove upvote
            thread.getVotes().put(userEmail, 0);
            thread.setUpvotes(thread.getUpvotes() - 1);
        } else if (currentVote == -1) {
            // Change downvote to upvote
            thread.getVotes().put(userEmail, 1);
            thread.setDownvotes(thread.getDownvotes() - 1);
            thread.setUpvotes(thread.getUpvotes() + 1);
        } else {
            // Add new upvote
            thread.getVotes().put(userEmail, 1);
            thread.setUpvotes(thread.getUpvotes() + 1);
        }

        return threadRepository.save(thread);
    }

    public Thread downvoteThread(Long id, String userEmail) {
        Thread thread = getThreadById(id);
        Integer currentVote = thread.getVotes().getOrDefault(userEmail, 0);

        // Update vote count based on previous vote
        if (currentVote == -1) {
            // Remove downvote
            thread.getVotes().put(userEmail, 0);
            thread.setDownvotes(thread.getDownvotes() - 1);
        } else if (currentVote == 1) {
            // Change upvote to downvote
            thread.getVotes().put(userEmail, -1);
            thread.setUpvotes(thread.getUpvotes() - 1);
            thread.setDownvotes(thread.getDownvotes() + 1);
        } else {
            // Add new downvote
            thread.getVotes().put(userEmail, -1);
            thread.setDownvotes(thread.getDownvotes() + 1);
        }

        return threadRepository.save(thread);
    }

    public Integer getUserVote(Long id, String userEmail) {
        Thread thread = getThreadById(id);
        return thread.getVotes().getOrDefault(userEmail, 0);
    }

    public List<Thread> searchThreads(String major, String course, User.Role authorRole) {
        return threadRepository.searchThreads(major, course, authorRole);
    }
}