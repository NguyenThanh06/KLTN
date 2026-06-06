package com.developer.EyesOnly.Controller;

import com.developer.EyesOnly.DTO.Request.ApiResponse;
import com.developer.EyesOnly.DTO.Response.CommentResponse;
import com.developer.EyesOnly.DTO.Response.PageResponse;
import com.developer.EyesOnly.DTO.Response.PostResponse;
import com.developer.EyesOnly.Service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*")
@RestController
@RequestMapping("/home")
public class HomeController {
    @Autowired
    PostService postService;

    @GetMapping()
    public PageResponse<PostResponse> getPosts(
            @RequestParam(defaultValue = "0") int page
    ) {
        return postService.getPosts(page);
    }
    /*
     * Endpoint riêng dành cho section Post ngẫu nhiên.
     *
     * GET /home/random
     */
    @GetMapping("/random")
    public PageResponse<PostResponse> getRandomPosts() {
        return postService.getRandomPosts();
    }

}
