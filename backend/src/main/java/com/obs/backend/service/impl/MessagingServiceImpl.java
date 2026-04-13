package com.obs.backend.service.impl;

import com.obs.backend.dto.student.ContactDTO;
import com.obs.backend.dto.student.MessageDTO;
import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.*;
import com.obs.backend.model.enums.Role;
import com.obs.backend.repository.*;
import com.obs.backend.service.MessagingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessagingServiceImpl implements MessagingService {

        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final StudentRepository studentRepository;
        private final EnrollmentRepository enrollmentRepository;
        private final SemesterRepository semesterRepository;
        private final CourseRepository courseRepository;

        @Override
        public List<ContactDTO> getContacts(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

                List<ContactDTO> contacts = new ArrayList<>();

                if (user.getRole() == Role.STUDENT) {
                        Student student = studentRepository.findById(user.getId())
                                        .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Student not found"));

                        if (student.getAdvisor() != null) {
                                Academician advisor = student.getAdvisor();
                                contacts.add(ContactDTO.builder()
                                                .id(advisor.getId())
                                                .name(advisor.getFirstName() + " " + advisor.getLastName())
                                                .role("Advisor")
                                                .online(true)
                                                .build());
                        }

                        Semester activeSemester = semesterRepository.findByIsActiveTrue().orElse(null);
                        if (activeSemester != null) {
                                enrollmentRepository
                                                .findByStudentIdAndSemesterId(student.getId(), activeSemester.getId())
                                                .forEach(enrollment -> {
                                                        Academician instructor = enrollment.getCourse().getInstructor();
                                                        if (contacts.stream().noneMatch(c -> c.getId().equals(instructor.getId()))) {
                                                                contacts.add(ContactDTO.builder()
                                                                                .id(instructor.getId())
                                                                                .name(instructor.getFirstName() + " " + instructor.getLastName())
                                                                                .role("Instructor (" + enrollment.getCourse().getCode() + ")")
                                                                                .online(false)
                                                                                .build());
                                                        }
                                                });
                        }
                } else if (user.getRole() == Role.ACADEMICIAN) {
                        // 1. Add Advisees
                        studentRepository.findByAdvisorId(user.getId()).forEach(advisee -> {
                                contacts.add(ContactDTO.builder()
                                                .id(advisee.getId())
                                                .name(advisee.getFirstName() + " " + advisee.getLastName())
                                                .role("Advisee")
                                                .online(false)
                                                .build());
                        });

                        // 2. Add Students in courses
                        // To avoid duplicates, we use a set or check exists
                        // For simplicity, we just iterate courses
                        courseRepository.findByInstructorId(user.getId()).forEach(course -> {
                                enrollmentRepository.findByCourseId(course.getId()).forEach(enrollment -> {
                                        Student student = enrollment.getStudent();
                                        if (contacts.stream().noneMatch(c -> c.getId().equals(student.getId()))) {
                                                contacts.add(ContactDTO.builder()
                                                                .id(student.getId())
                                                                .name(student.getFirstName() + " " + student.getLastName())
                                                                .role("Student (" + course.getCode() + ")")
                                                                .online(false)
                                                                .build());
                                        }
                                });
                        });
                }

                // Fill last messages for each contact
                contacts.forEach(contact -> {
                        chatMessageRepository.findChatHistory(user.getId(), contact.getId()).stream()
                                        .findFirst()
                                        .ifPresent(msg -> {
                                                contact.setLastMessage(msg.getContent());
                                                contact.setLastMessageTime(msg.getTimestamp().toString());
                                        });
                });

                return contacts;
        }

        @Override
        @Transactional
        public MessageDTO sendMessage(String senderUsername, Long receiverId, String content) {
                User sender = userRepository.findByUsername(senderUsername)
                                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Sender not found"));

                User receiver = userRepository.findById(receiverId)
                                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND,
                                                "Receiver not found"));

                ChatMessage chatMsg = ChatMessage.builder()
                                .content(content)
                                .sender(sender)
                                .receiver(receiver)
                                .timestamp(LocalDateTime.now())
                                .isRead(false)
                                .build();

                ChatMessage savedMsg = chatMessageRepository.save(chatMsg);
                return mapToDTO(savedMsg);
        }

        @Override
        public List<MessageDTO> getChatHistory(String username, Long otherUserId) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

                return chatMessageRepository.findChatHistory(user.getId(), otherUserId)
                                .stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Override
        public List<MessageDTO> getUnreadMessages(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

                return chatMessageRepository.findByReceiverIdAndIsReadFalse(user.getId())
                                .stream()
                                .map(this::mapToDTO)
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional
        public void markAsRead(Long messageId) {
                ChatMessage message = chatMessageRepository.findById(messageId)
                                .orElseThrow(() -> new ObsException(ErrorCode.RESOURCE_NOT_FOUND, "Message not found"));
                message.setRead(true);
                chatMessageRepository.save(message);
        }

        private MessageDTO mapToDTO(ChatMessage message) {
                return MessageDTO.builder()
                                .id(message.getId())
                                .content(message.getContent())
                                .senderId(message.getSender().getId())
                                .senderName(message.getSender().getFirstName() + " "
                                                + message.getSender().getLastName())
                                .timestamp(message.getTimestamp())
                                .isRead(message.isRead())
                                .build();
        }
}
