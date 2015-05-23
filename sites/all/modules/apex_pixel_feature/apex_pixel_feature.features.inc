<?php
/**
 * @file
 * apex_pixel_feature.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function apex_pixel_feature_ctools_plugin_api() {
  list($module, $api) = func_get_args();
  if ($module == "context" && $api == "context") {
    return array("version" => "3");
  }
}
