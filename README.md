# Evilwaf

Evilwaf try to identify a WAF (Web Application Firewall) in front of a web application.

[![Build Status](https://secure.travis-ci.org/eviltik/evilwaf.png)](http://travis-ci.org/eviltik/evilwaf)

<!--[![NPM](https://nodei.co/npm-dl/evilwaf.png)](https://nodei.co/npm-dl/evilwaf/)-->

----

### Work in progress, no release yet

----

### WAF Vendors support


|                        | Product           | cmd.exe               | &lt;script            | &lt;script&gt;         | OR B=B                   |
| :--------------------: | ----------------- | :-------------------: | :-------------------: | :--------------------: | :----------------------: |
| :large_orange_diamond: | Barracuda         | :white_medium_square: | :white_medium_square: | :white_square_button:  | :white_medium_square:    |
| :large_blue_diamond:   | DenyAll DAWAF     | :white_square_button: | :white_square_button: | :white_square_button:  | :white_square_button:    |
| :large_orange_diamond: | F5 ASM            | :white_medium_square: | :white_square_button: | :white_square_button:  | :white_medium_square:    |
| :large_blue_diamond:   | Imperva Incapsula | :white_square_button: | :white_square_button: | :white_square_button:  | :white_square_button:    |
| :large_orange_diamond: | Nevis             | :white_square_button: | :white_square_button: | :white_square_button:  | :white_medium_square:    |
| :large_orange_diamond: | Radware Appwall   | :white_square_button: | :white_medium_square: | :white_square_button:  | :white_square_button:    |

:large_blue_diamond: Evilwaf detector implemented

:large_orange_diamond: Evilwaf detector not yet implemented

:white_medium_square: Pattern NOT blocked

:white_square_button: Pattern blocked

----