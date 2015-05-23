<?php
/**
 * @file
 * cta_block_field.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function cta_block_field_ctools_plugin_api() {
  list($module, $api) = func_get_args();
  if ($module == "ds" && $api == "ds") {
    return array("version" => "1");
  }
}
