package com.grapevine.service;

import com.grapevine.model.Comment;
import com.grapevine.model.Thread;
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

    public Thread likeThread(Long id) {
        Thread thread = getThreadById(id);
        thread.setLikes(thread.getLikes() + 1);
        return threadRepository.save(thread);
    }
}