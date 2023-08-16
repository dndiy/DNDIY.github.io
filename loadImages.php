<?php
$directory = 'path_to_your_images_folder/'; 
$allowed_types = array('jpg', 'jpeg', 'gif', 'png'); 
$file_parts = array();
$ext = '';
$output = '';

$dir_handle = @opendir($directory) or die("There's an error with your image directory!");

while ($file = readdir($dir_handle)) {
    if ($file == '.' || $file == '..') continue;

    $file_parts = explode('.', $file);
    $ext = strtolower(array_pop($file_parts));

    if (in_array($ext, $allowed_types)) {
        $output .= "'$directory$file',";
    }
}

closedir($dir_handle);
echo "[" . rtrim($output, ',') . "]";
?>
