package com.grapevine.service;

import com.grapevine.exception.EventNotFoundException;
import com.grapevine.exception.UnauthorizedException;
import com.grapevine.model.Event;
import com.grapevine.model.EventReminder;
import com.grapevine.model.Notification;
import com.grapevine.model.User;
import com.grapevine.repository.EventReminderRepository;
import com.grapevine.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventReminderService {

    private final EventReminderRepository eventReminderRepository;
    private final EventRepository eventRepository;
    private final NotificationService notificationService;
    private final UserService userService;

    @Transactional
    public EventReminder createReminder(Long eventId, String userEmail, long timeBeforeInMinutes) {
        // Get the event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        // Check if user is authorized (must be a host or participant)
        if (!event.getHosts().contains(userEmail) && !event.getParticipants().contains(userEmail)) {
            throw new UnauthorizedException("You must be a participant or host of this event to set reminders");
        }

        // Check if the event time is in the future
        if (event.getEventTime() == null || event.getEventTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Cannot set reminders for past events or events with no time");
        }

        // Calculate the reminder time
        LocalDateTime reminderTime = event.getEventTime().minus(timeBeforeInMinutes, ChronoUnit.MINUTES);

        // Check if the reminder time is in the future
        if (reminderTime.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reminder time must be in the future");
        }

        // Create and save the reminder
        EventReminder reminder = new EventReminder();
        reminder.setEventId(eventId);
        reminder.setUserEmail(userEmail);
        reminder.setReminderTime(reminderTime);

        return eventReminderRepository.save(reminder);
    }

    @Transactional
    public List<EventReminder> getRemindersForEvent(Long eventId, String userEmail) {
        // Get the event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFoundException("Event not found with id: " + eventId));

        // Check if user is authorized (must be a host or participant)
        if (!event.getHosts().contains(userEmail) && !event.getParticipants().contains(userEmail)) {
            throw new UnauthorizedException("You must be a participant or host of this event to view reminders");
        }

        return eventReminderRepository.findByEventIdAndUserEmail(eventId, userEmail);
    }

    @Transactional
    public void deleteReminder(Long reminderId, String userEmail) {
        EventReminder reminder = eventReminderRepository.findById(reminderId)
                .orElseThrow(() -> new IllegalArgumentException("Reminder not found"));

        // Check if user is authorized (must be the owner of the reminder)
        if (!reminder.getUserEmail().equals(userEmail)) {
            throw new UnauthorizedException("You can only delete your own reminders");
        }

        eventReminderRepository.delete(reminder);
    }

    @Transactional
    public void processDueReminders() {
        LocalDateTime now = LocalDateTime.now().withSecond(0).withNano(0);
        System.out.println("Processing reminders at exact time: " + now);

        List<EventReminder> dueReminders = eventReminderRepository.findExactDueReminders(now);
        System.out.println("Found " + dueReminders.size() + " due reminders");

        for (EventReminder reminder : dueReminders) {
            System.out.println("Processing reminder: " + reminder.getReminderId() +
                    " with time: " + reminder.getReminderTime());
            processReminder(reminder);
        }
    }

    @Transactional
    public void processDueRemindersForTime(LocalDateTime targetTime) {
        System.out.println("Processing reminders for time: " + targetTime);
        List<EventReminder> dueReminders = eventReminderRepository.findExactDueReminders(targetTime);
        System.out.println("Found " + dueReminders.size() + " due reminders");

        for (EventReminder reminder : dueReminders) {
            System.out.println("Processing reminder: " + reminder.getReminderId() +
                    " with time: " + reminder.getReminderTime());
            processReminder(reminder);
        }
    }

    private void processReminder(EventReminder reminder) {
        try {
            // Get event details
            Event event = eventRepository.findById(reminder.getEventId())
                    .orElseThrow(() -> new EventNotFoundException("Event not found"));

            // Check if user is online
            boolean isUserOnline = userService.isUserOnline(reminder.getUserEmail());

            // Calculate time in minutes or hours
            String timeUnit;
            long timeAmount;
            long minutesUntilEvent = ChronoUnit.MINUTES.between(LocalDateTime.now(), event.getEventTime());

            if (minutesUntilEvent >= 10080) {
                timeAmount = minutesUntilEvent / 10080;
                timeUnit = timeAmount == 1 ? "week" : "weeks";
            } else if (minutesUntilEvent >= 1440) {
                timeAmount = minutesUntilEvent / 1440;
                timeUnit = timeAmount == 1 ? "day" : "days";
            } else if (minutesUntilEvent >= 60) {
                timeAmount = minutesUntilEvent / 60;
                timeUnit = timeAmount == 1 ? "hour" : "hours";
            } else {
                timeAmount = minutesUntilEvent;
                timeUnit = timeAmount == 1 ? "minute" : "minutes";
            }

            // Create a notification for the user
            String content = "Reminder: \"" + event.getName() + "\" starts in " + timeAmount + " " + timeUnit;

            // Create notification with N/A as sender
            Notification notification = notificationService.createNotification(
                    reminder.getUserEmail(),
                    "N/A",
                    Notification.NotificationType.EVENT_REMINDER,
                    content,
                    reminder.getEventId()
            );

            // If user is online, push the notification immediately
            if (isUserOnline) {
                notificationService.sendNotificationToUser(notification);
                // Mark as read since we sent it via push
                notificationService.markAsRead(notification.getNotificationId(), reminder.getUserEmail());
            }

            // Mark reminder as sent
            eventReminderRepository.markAsSent(reminder.getReminderId());

        } catch (Exception e) {
            // Log the error but continue processing other reminders
            System.err.println("Error processing reminder ID " + reminder.getReminderId() + ": " + e.getMessage());
        }
    }
}