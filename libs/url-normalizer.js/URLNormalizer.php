<?php

class URLNormalizer
{
    public static function replaceVar($str, $vars, $query)
    {
        return preg_replace_callback('/{\$([^}]*)}/', function($matches) use ($vars, $query) {
            if (preg_match('/^[0-9]*$/', $matches[1])) {
                return $vars[intval($matches[1])];
            }

            parse_str($query, $params);
            return $params[strval($matches[1])];
        }, $str);
    }

    public static function query($url)
    {
        $csvmap = self::getCSVMap();

        $url_parts = parse_url($url);
        $ret = new StdClass;
        $ret->query_url = $url;
        foreach ($csvmap as $line) {
            if ($line[0] != $url_parts['host']) {
                continue;
            }
            if (!preg_match($line[1], urldecode($url_parts['path']), $matches)) {
                continue;
            }
            $ret->normalized_url = self::replaceVar($line[2], $matches, array_key_exists('query', $url_parts) ? $url_parts['query'] : '');
            $ret->normalized_id = self::replaceVar($line[3], $matches, array_key_exists('query', $url_parts) ? $url_parts['query'] : '');
            return $ret;
        }
    }

    protected static $_csvmap = null;

    public static function getCSVMap()
    {
        if (!is_null(self::$_csvmap)) {
            return self::$_csvmap;
        }

        $fp = fopen(__DIR__ . '/map.csv', 'r');
        $columns = fgetcsv($fp);
        $csvmap = array();
        while ($row = fgetcsv($fp)) {
            $csvmap[] = $row;
        }
        return self::$_csvmap = $csvmap;
    }
}
