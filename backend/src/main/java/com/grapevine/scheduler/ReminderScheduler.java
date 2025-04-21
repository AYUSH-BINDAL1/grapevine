package com.grapevine.scheduler;

import com.grapevine.service.EventReminderService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class ReminderScheduler {

    private final EventReminderService eventReminderService;

    @Scheduled(fixedRate = 60000) // Run every minute
    public void checkAndSendReminders() {
        eventReminderService.processDueReminders();
    }
}