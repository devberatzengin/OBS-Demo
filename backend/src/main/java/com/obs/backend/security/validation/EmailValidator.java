package com.obs.backend.security.validation;

import com.obs.backend.exception.ErrorCode;
import com.obs.backend.exception.ObsException;
import com.obs.backend.model.enums.Role;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

@Component
public class EmailValidator {

    private static final String STUDENT_EMAIL_REGEX = "^[0-9]+@uni\\.edu\\.tr$";
    private static final String STAFF_EMAIL_REGEX = "^[a-z]+\\.[a-z]+@uni\\.edu\\.tr$";

    private static final Pattern STUDENT_PATTERN = Pattern.compile(STUDENT_EMAIL_REGEX);
    private static final Pattern STAFF_PATTERN = Pattern.compile(STAFF_EMAIL_REGEX);

    public void validate(String email, Role role) {
        if (email == null) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR, "Email cannot be null");
        }

        boolean isValid;
        String errorMessage;

        if (role == Role.STUDENT) {
            isValid = STUDENT_PATTERN.matcher(email.toLowerCase()).matches();
            errorMessage = "Student email must follow 'studentNumber@uni.edu.tr' format";
        } else {
            isValid = STAFF_PATTERN.matcher(email.toLowerCase()).matches();
            errorMessage = role.name() + " email must follow 'firstname.lastname@uni.edu.tr' format";
        }

        if (!isValid) {
            throw new ObsException(ErrorCode.VALIDATION_ERROR, errorMessage);
        }
    }
}
