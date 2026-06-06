package com.developer.EyesOnly.Mapper;

import com.developer.EyesOnly.DTO.Request.CommentRequest;
import com.developer.EyesOnly.DTO.Response.CommentResponse;
import com.developer.EyesOnly.Entity.Comment;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
@Mapper(componentModel = "spring")
public interface CommentMapper {
    Comment toComment(CommentRequest request);
    CommentResponse toCommentResponse(Comment comment);
}
