#ifndef UTIL_HPP
#define UTIL_HPP

#include <string>

std::string exec( const char* cmd );

struct curlReadBuffer
{
    char * ptr;
    size_t size;
};

size_t curlResponseWriteCB( char *ptr, size_t size, size_t nmemb, void *userdata );
size_t curlBodyReadCB( char *ptr, size_t size, size_t nitems, void *userdata );
void generateKeys( std::string & a_pub_key, std::string & a_priv_key );
std::string parseQuery( const std::string & a_query );
void hexDump( const char * a_buffer, const char *a_buffer_end, std::ostream & a_out );
std::string escapeCSV( const std::string & a_value );
std::string escapeJSON( const std::string & a_value );

#endif
