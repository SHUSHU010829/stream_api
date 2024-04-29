USE `stream`;

CREATE TABLE `song_list` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `create_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `song_title` VARCHAR(100),
    `singer` VARCHAR(100),
    `song_tags` JSON,
    `now_playing` BOOLEAN,
    PRIMARY KEY (`id`)
);