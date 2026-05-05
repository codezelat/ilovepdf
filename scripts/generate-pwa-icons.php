<?php

declare(strict_types=1);

$root = dirname(__DIR__);

foreach ([192 => 'icon-192.png', 512 => 'icon-512.png', 180 => 'apple-touch-icon.png'] as $size => $name) {
    $image = imagecreatetruecolor($size, $size);
    imagesavealpha($image, true);
    imageantialias($image, true);

    $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
    imagefill($image, 0, 0, $transparent);

    $navy = imagecolorallocate($image, 2, 6, 23);
    $blue = imagecolorallocate($image, 3, 93, 168);
    $blueLight = imagecolorallocate($image, 14, 165, 233);
    $white = imagecolorallocate($image, 248, 250, 252);
    $silver = imagecolorallocate($image, 213, 219, 229);
    $red = imagecolorallocate($image, 239, 68, 68);
    $pink = imagecolorallocate($image, 255, 180, 180);

    roundedRect($image, 0, 0, $size, $size, (int) round($size * 0.22), $navy);

    imagefilledellipse($image, (int) round($size * 0.42), (int) round($size * 0.48), (int) round($size * 0.48), (int) round($size * 0.48), $blue);
    imagefilledellipse($image, (int) round($size * 0.49), (int) round($size * 0.48), (int) round($size * 0.37), (int) round($size * 0.37), $navy);
    imagefilledellipse($image, (int) round($size * 0.31), (int) round($size * 0.34), (int) round($size * 0.16), (int) round($size * 0.16), $blueLight);

    foreach ([
        [272, 123, 376, 151, 342, 193, 246, 174],
        [382, 166, 431, 235, 386, 263, 338, 203],
        [429, 279, 366, 357, 331, 315, 386, 244],
        [312, 368, 223, 350, 247, 300, 338, 317],
        [194, 325, 145, 255, 189, 226, 240, 285],
        [168, 210, 239, 145, 274, 188, 210, 248],
    ] as $points) {
        imagefilledpolygon($image, scalePoints($points, $size), $silver);
    }

    $x = (int) round($size * 0.405);
    $y = (int) round($size * 0.355);
    $w = (int) round($size * 0.265);
    $h = (int) round($size * 0.295);
    imagefilledpolygon($image, [$x, $y, $x + $w - 48 * $size / 512, $y, $x + $w, $y + 48 * $size / 512, $x + $w, $y + $h, $x, $y + $h], $white);
    imagesetthickness($image, max(2, (int) round($size * 0.02)));
    imageline($image, $x + (int) round($w * 0.64), $y, $x + (int) round($w * 0.64), $y + (int) round($h * 0.34), $silver);
    imageline($image, $x + (int) round($w * 0.64), $y + (int) round($h * 0.34), $x + $w, $y + (int) round($h * 0.34), $silver);

    imagesetthickness($image, max(3, (int) round($size * 0.025)));
    imageline($image, $x + (int) round($w * 0.18), $y + (int) round($h * 0.62), $x + (int) round($w * 0.78), $y + (int) round($h * 0.62), $silver);
    imageline($image, $x + (int) round($w * 0.18), $y + (int) round($h * 0.80), $x + (int) round($w * 0.62), $y + (int) round($h * 0.80), $silver);

    imagefilledellipse($image, (int) round($size * 0.557), (int) round($size * 0.535), (int) round($size * 0.205), (int) round($size * 0.205), $red);
    imagesetthickness($image, max(2, (int) round($size * 0.018)));
    imagearc($image, (int) round($size * 0.557), (int) round($size * 0.535), (int) round($size * 0.12), (int) round($size * 0.07), 28, 152, $pink);

    roundedRect($image, (int) round($size * 0.715), (int) round($size * 0.258), (int) round($size * 0.09), (int) round($size * 0.09), (int) round($size * 0.014), $blueLight);
    roundedRect($image, (int) round($size * 0.715), (int) round($size * 0.365), (int) round($size * 0.09), (int) round($size * 0.09), (int) round($size * 0.014), $silver);
    roundedRect($image, (int) round($size * 0.822), (int) round($size * 0.32), (int) round($size * 0.09), (int) round($size * 0.09), (int) round($size * 0.014), $blue);

    imagepng($image, "$root/public/icons/$name");
}

function roundedRect(GdImage $image, int $x, int $y, int $width, int $height, int $radius, int $color): void
{
    imagefilledrectangle($image, $x + $radius, $y, $x + $width - $radius, $y + $height, $color);
    imagefilledrectangle($image, $x, $y + $radius, $x + $width, $y + $height - $radius, $color);
    imagefilledellipse($image, $x + $radius, $y + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($image, $x + $width - $radius, $y + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($image, $x + $radius, $y + $height - $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($image, $x + $width - $radius, $y + $height - $radius, $radius * 2, $radius * 2, $color);
}

/**
 * @param list<int> $points
 * @return list<int>
 */
function scalePoints(array $points, int $size): array
{
    return array_map(static fn (int $point): int => (int) round($point * $size / 512), $points);
}
