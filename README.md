# translate
Just a quick experiment with translation using Google's Translation API against a gettext po file.

To run:

node translate \<filename.po\> \<target-language\> \<source-language\>

\<target-language\> and \<source-language\> are in ISO639-1 format (https://www.loc.gov/standards/iso639-2/php/code_list.php) for example:
en - English
es - Spanish

\<source-language\> defaults to English

For example:

node translate i18n/en.po fr

Translates an English file in the i18n directory into French and creates an i18n/fr.po file.
