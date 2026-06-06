package com.developer.EyesOnly.Mapper;

import com.developer.EyesOnly.DTO.Response.PostResponse;
import com.developer.EyesOnly.Entity.KTEOFile;
import com.developer.EyesOnly.Entity.Post;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PostMapper {

    public PostResponse toPostResponse(Post post, Long luotThich, Boolean daThich) {
        List<KTEOFile> files = post.getFiles() != null
                ? post.getFiles()
                : List.of();

        return new PostResponse(
                post.getPostID(),
                post.getTieuDe(),
                post.getMoTa(),

                post.getTacGia() != null ? post.getTacGia().getTenHienThi() : null,
                post.getTacGia() != null ? post.getTacGia().getAvatar() : null,
                post.getTacGia().getAccountID(),
                files,

                luotThich,
                daThich,
                post.getLuotXem(),
                post.getSanPhamAI(),
                post.getHanCheHienThi()
        );
    }
}