package com.developer.EyesOnly.Exception;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
public class GlobalExceptionHandler {


    @ExceptionHandler(value = AppException.class)
    public ResponseEntity<ApiResponse> handleAppException(AppException exception) {

        ErrorCode errorCode = exception.getErrorCode();

        ApiResponse apiResponse = ApiResponse.builder()
                .status(errorCode.getHttpStatus().value())
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(apiResponse);
    }

    @ExceptionHandler(value = RuntimeException.class)
    public ResponseEntity<ApiResponse> handleRuntimeException(RuntimeException ex) {

        ApiResponse response = ApiResponse.builder()
                .status(400)
                .code("9998")
                .message(ex.getMessage())
                .build();

        return ResponseEntity.badRequest().contentType(MediaType.APPLICATION_JSON).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidation(
            MethodArgumentNotValidException exception) {

        String enumKey = exception.getFieldError().getDefaultMessage();

        ErrorCode errorCode = ErrorCode.valueOf(enumKey);

        ApiResponse apiResponse = ApiResponse.builder()
                .status(errorCode.getHttpStatus().value())
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(apiResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleException(Exception ex) {

        ApiResponse<Object> response = ApiResponse.<Object>builder()
                .status(500)
                .code("9999")
                .message("Lỗi hệ thống")
                .result(null)
                .build();

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }
}

