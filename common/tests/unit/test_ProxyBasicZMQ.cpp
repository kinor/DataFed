#define BOOST_TEST_MAIN

#define BOOST_TEST_MODULE proxy_basic_zmq
#include <boost/filesystem.hpp>
#include <boost/test/unit_test.hpp>

// Local public includes
#include "CommunicatorFactory.hpp"
#include "CredentialFactory.hpp"
#include "ICredentials.hpp"
#include "IOperator.hpp"
#include "MessageFactory.hpp"
#include "OperatorFactory.hpp"
#include "OperatorTypes.hpp"
#include "servers/ProxyBasicZMQ.hpp"
#include "SocketOptions.hpp"

// Proto file includes
#include <SDMS_Anon.pb.h>
#include <SDMS_Auth.pb.h>

// Standard includes
#include <memory>
#include <string>
#include <thread>
#include <unordered_map>

using namespace SDMS;

BOOST_AUTO_TEST_SUITE(ProxyBasicZMQTest)

BOOST_AUTO_TEST_CASE( testing_ProxyBasicZMQ ) {

//  const std::string channel_between_proxy_and_backend = "channeltobackend_basicZMQ";
//  const std::string channel_between_proxy_and_frontend = "channeltofrontend_basicZMQ";
  CommunicatorFactory factory;

  const std::string server_id = "overlord";
  auto server = [&]() {
    /// Creating input parameters for constructing Communication Instance
    SocketOptions socket_options;
    socket_options.scheme = URIScheme::INPROC;
    socket_options.class_type = SocketClassType::SERVER; 
    socket_options.direction_type = SocketDirectionalityType::BIDIRECTIONAL; 
    socket_options.communication_type = SocketCommunicationType::SYNCHRONOUS;
    socket_options.connection_life = SocketConnectionLife::INTERMITTENT;
    socket_options.protocol_type = ProtocolType::ZQTP; 
    socket_options.host = "backend";
    //socket_options.port = 1341;
    socket_options.local_id = server_id;

    std::string public_key = "my_pub_key";
    std::string secret_key = "my_priv_key";
    std::string server_key = "my_serv_key";
    CredentialFactory cred_factory;

    std::unordered_map<CredentialType, std::variant<std::string>> cred_options;
    cred_options[CredentialType::PUBLIC_KEY] = public_key;
    cred_options[CredentialType::PRIVATE_KEY] = secret_key;
    cred_options[CredentialType::SERVER_KEY] = server_key;

    auto credentials = cred_factory.create(ProtocolType::ZQTP, cred_options);

    uint32_t timeout_on_receive = 10;
    long timeout_on_poll = 10;

    // When creating a communication channel with a client application we need
    // to locally have a server socket. So though we have specified a server
    // socket we will actually be communicating with a client.
    return factory.create(
        socket_options,
        *credentials,
        timeout_on_receive,
        timeout_on_poll);
  }();

  const std::string client_id = "minion";
  auto client = [&]() {
    /// Creating input parameters for constructing Communication Instance
    SocketOptions socket_options;
    socket_options.scheme = URIScheme::INPROC;
    socket_options.class_type = SocketClassType::CLIENT; 
    socket_options.direction_type = SocketDirectionalityType::BIDIRECTIONAL; 
    socket_options.communication_type = SocketCommunicationType::ASYNCHRONOUS;
    socket_options.connection_life = SocketConnectionLife::INTERMITTENT;
    socket_options.protocol_type = ProtocolType::ZQTP; 
    socket_options.host = "frontend"; //channel_between_proxy_and_frontend;
    //socket_options.port = 1341;
    socket_options.local_id = client_id;

    std::string public_key = "my_pub_key";
    std::string secret_key = "my_priv_key";
    std::string server_key = "my_serv_key";
    CredentialFactory cred_factory;

    std::unordered_map<CredentialType, std::variant<std::string>> cred_options;
    cred_options[CredentialType::PUBLIC_KEY] = public_key;
    cred_options[CredentialType::PRIVATE_KEY] = secret_key;
    cred_options[CredentialType::SERVER_KEY] = server_key;

    auto credentials = cred_factory.create(ProtocolType::ZQTP, cred_options);

    // Make it wait forever
    uint32_t timeout_on_receive = -1;
    long timeout_on_poll = 10;

    // When creating a communication channel with a server application we need
    // to locally have a client socket. So though we have specified a client
    // socket we will actually be communicating with the server.
    return factory.create(
        socket_options,
        *credentials,
        timeout_on_receive,
        timeout_on_poll);
  }();


  /// Start the proxy
  const std::string proxy_client_id = "MiddleMan_client_socket";
  const std::string proxy_server_id = "MiddleMan_server_socket";
  std::unique_ptr<std::thread> proxy_thread = std::unique_ptr<std::thread>(new std::thread(
        [](const std::string proxy_client_id, const std::string proxy_server_id) { 

        std::unordered_map<SocketRole, SocketOptions> socket_options;
        std::unordered_map<SocketRole, ICredentials *> socket_credentials;

        const std::string channel_between_proxy_and_backend = "backend";
        const std::string channel_between_proxy_and_frontend = "frontend";
        // Credentials are allocated on the heap, to ensure they last until the end of
        // the test they must be defined outside of the scope block below
        std::unique_ptr<ICredentials> client_credentials;

        { // Proxy Client Credentials and Socket Options - these options are used
        // to define the client socket that the proxy will use to communicate with
        // the backend. The proxy acts like a client to the backend
        SocketOptions client_socket_options;
        client_socket_options.scheme = URIScheme::INPROC;
        client_socket_options.class_type = SocketClassType::CLIENT; 
        client_socket_options.direction_type = SocketDirectionalityType::BIDIRECTIONAL; 
        client_socket_options.communication_type = SocketCommunicationType::ASYNCHRONOUS;
        client_socket_options.connection_life = SocketConnectionLife::PERSISTENT;
        client_socket_options.protocol_type = ProtocolType::ZQTP; 
        client_socket_options.host = channel_between_proxy_and_backend;
//        client_socket_options.port = 1341;
        client_socket_options.local_id = proxy_client_id;
        socket_options[SocketRole::CLIENT] = client_socket_options;

        std::string public_key = "my_pub_key";
        std::string secret_key = "my_priv_key";
        std::string server_key = "my_serv_key";
        CredentialFactory cred_factory;

        std::unordered_map<CredentialType, std::variant<std::string>> cred_options;
        cred_options[CredentialType::PUBLIC_KEY] = public_key;
        cred_options[CredentialType::PRIVATE_KEY] = secret_key;
        cred_options[CredentialType::SERVER_KEY] = server_key;

        client_credentials = cred_factory.create(ProtocolType::ZQTP, cred_options);
        socket_credentials[SocketRole::CLIENT] = client_credentials.get();
        }

        // Credentials are allocated on the heap, to ensure they last until the end of
        // the test they must be defined outside of the scope block below
        std::unique_ptr<ICredentials> server_credentials;

        { // Proxy Server Credentials and Socket Options - these options are used
          // to define the server socket that the proxy will use to communicate with
          // the frontend. The proxy acts like a server to the frontend
          SocketOptions server_socket_options;
          server_socket_options.scheme = URIScheme::INPROC;
          server_socket_options.class_type = SocketClassType::SERVER; 
          server_socket_options.direction_type = SocketDirectionalityType::BIDIRECTIONAL; 
          server_socket_options.communication_type = SocketCommunicationType::ASYNCHRONOUS;
          server_socket_options.connection_life = SocketConnectionLife::PERSISTENT;
          server_socket_options.protocol_type = ProtocolType::ZQTP; 
          server_socket_options.host = channel_between_proxy_and_frontend;
          //server_socket_options.port = 1341;
          server_socket_options.local_id = proxy_server_id;
          socket_options[SocketRole::SERVER] = server_socket_options;

          std::string public_key = "my_pub_key";
          std::string secret_key = "my_priv_key";
          std::string server_key = "my_serv_key";
          CredentialFactory cred_factory;

          std::unordered_map<CredentialType, std::variant<std::string>> cred_options;
          cred_options[CredentialType::PUBLIC_KEY] = public_key;
          cred_options[CredentialType::PRIVATE_KEY] = secret_key;
          cred_options[CredentialType::SERVER_KEY] = server_key;

          server_credentials = cred_factory.create(ProtocolType::ZQTP, cred_options);
          socket_credentials[SocketRole::SERVER] = server_credentials.get();

        }

        ProxyBasicZMQ proxy(socket_options, socket_credentials);

        std::chrono::duration<double> duration = std::chrono::milliseconds(30);
        proxy.setRunDuration(duration);
        proxy.run();

        // Pass the arguments to the Thread
        }, proxy_client_id, proxy_server_id
  ));

  const std::string id = "royal_messenger";
  const std::string key = "skeleton";
  const std::string token = "chest_of_gold";
  MessageFactory msg_factory;
   // Client send
    auto msg_from_client = msg_factory.create(MessageType::GOOGLE_PROTOCOL_BUFFER);
    msg_from_client->set(MessageAttribute::ID, id);
    msg_from_client->set(MessageAttribute::KEY, key);
    auto auth_by_token_req = std::make_unique<Anon::AuthenticateByTokenRequest>();
    auth_by_token_req->set_token(token);
    msg_from_client->setPayload(std::move(auth_by_token_req));

    std::this_thread::sleep_for (std::chrono::milliseconds(100));
    client->send(*msg_from_client);
   // Client send

  { // Server receive
    ICommunicator::Response response = server->receive(MessageType::GOOGLE_PROTOCOL_BUFFER);

    std::chrono::duration<double> duration = std::chrono::milliseconds(50);
    auto end_time = std::chrono::steady_clock::now() + duration;
    while ( response.time_out and end_time > std::chrono::steady_clock::now() ) {
      response = server->receive(MessageType::GOOGLE_PROTOCOL_BUFFER);
    }

    BOOST_CHECK( response.time_out == false);
    BOOST_CHECK( response.error == false);

    BOOST_CHECK( std::get<std::string>(response.message->get(MessageAttribute::KEY)).compare(key) == 0);
    BOOST_CHECK( std::get<std::string>(response.message->get(MessageAttribute::ID)).compare(id) == 0);

    const auto & routes = response.message->getRoutes();
    std::cout << "Routes are:" << std::endl;
    for( const auto & route : routes ) {
      std::cout << route << std::endl;
    }

    //BOOST_CHECK(routes.front().compare(proxy_client_id) == 0);
    //BOOST_CHECK(routes.back().compare(client_id) == 0);
    // Should have been recorded that the message was passed via two different
    // clients, Use require because we don't want the proxy to continue to run
    BOOST_REQUIRE( routes.size() == 0);

    BOOST_CHECK(std::get<std::string>(response.message->get(MessageAttribute::ID)).compare(id) == 0);
    BOOST_CHECK(std::get<std::string>(response.message->get(MessageAttribute::KEY)).compare(key) == 0);

  } // Server receive
  proxy_thread->join();
}

BOOST_AUTO_TEST_SUITE_END()

