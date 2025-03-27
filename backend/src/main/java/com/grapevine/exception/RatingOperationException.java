package com.grapevine.exception;

public class RatingOperationException extends RuntimeException {
    public RatingOperationException(String message) {
        super(message);
    }
}