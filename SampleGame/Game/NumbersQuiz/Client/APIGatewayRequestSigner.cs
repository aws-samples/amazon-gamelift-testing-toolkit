// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;
using Amazon.Runtime;
using System.Text;
using AWSSignatureV4_S3_Sample.Signers;
using System.Net.Http;

public class APIGatewayRequestSigner
{
    private string _regionName;
    private string _serviceName = "execute-api";

    public APIGatewayRequestSigner(string region)
    {
        _regionName = region;
    }

    public string GenerateSignedUrl(string url, ImmutableCredentials credentials)
    {
        var endpointUri = url;

        var uri = new Uri(endpointUri);

        var headers = new Dictionary<string, string>
        {
            //{AWS4SignerBase.X_Amz_Content_SHA256, AWS4SignerBase.EMPTY_BODY_SHA256},
        };

        var signer = new AWS4SignerForQueryParameterAuth
        {
            EndpointUri = new Uri(endpointUri),
            HttpMethod = "GET",
            Service = _serviceName,
            Region = _regionName
        };
        
        var queryParams = new StringBuilder();
        queryParams.AppendFormat("{0}={1}", "X-Amz-Security-Token", UriEncode(credentials.Token, true));
        var contentHash = AWS4SignerBase.CanonicalRequestHashAlgorithm.ComputeHash(Encoding.UTF8.GetBytes(""));
        var contentHashString = AWS4SignerBase.ToHexString(contentHash, true);
        
        var authorization = signer.ComputeSignature(headers,
            queryParams.ToString(),
            contentHashString,
            credentials.AccessKey,
            credentials.SecretKey);

        // build the presigned url to incorporate the authorization element
        var urlBuilder = new StringBuilder(endpointUri.ToString());

        // add our query params
        //urlBuilder.AppendFormat("?{0}", queryParams.ToString());

        // and finally the Signature V4 authorization string components
        urlBuilder.AppendFormat("?{0}", authorization);
        urlBuilder.AppendFormat("&{0}={1}", "X-Amz-Security-Token", UriEncode(credentials.Token, true));

        var presignedUrl = urlBuilder.ToString();
        return presignedUrl;
    }
    
    public HttpRequestMessage GenerateSignedGetRequest(string url, ImmutableCredentials credentials)
    {
        var endpointUri = url;

        var uri = new Uri(endpointUri);

        var headers = new Dictionary<string, string>
        {
            {AWS4SignerBase.X_Amz_Content_SHA256, AWS4SignerBase.EMPTY_BODY_SHA256},
        };

        var signer = new AWS4SignerForAuthorizationHeader
        {
            EndpointUri = uri,
            HttpMethod = "GET",
            Service = _serviceName,
            Region = _regionName
        };

        //Extract the query parameters
        var queryParams = "";
        if (url.Split('?').Length > 1)
        {
            queryParams = url.Split('?')[1];
        }

        var authorization = signer.ComputeSignature(headers,
            queryParams,
            AWS4SignerBase.EMPTY_BODY_SHA256,
            credentials.AccessKey,
            credentials.SecretKey);

        headers.Add("Authorization", authorization);

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.Get,
            RequestUri = new Uri(url),
        };

        // Add the generated headers to the request
        foreach (var header in headers)
        {
            try
            {
                if (header.Key != null && header.Value != null)
                    request.Headers.Add(header.Key, header.Value);
            }
            catch (Exception e)
            {
                Console.WriteLine("error: " + e.GetType().ToString());
            }
        }

        // Add the IAM authentication token
        request.Headers.Add("x-amz-security-token", credentials.Token);

        return request;
    }
    
    public HttpRequestMessage GenerateSignedPostRequest(string url, string postData, ImmutableCredentials credentials)
    {
        var endpointUri = url;
        
        var contentHash = AWS4SignerBase.CanonicalRequestHashAlgorithm.ComputeHash(Encoding.UTF8.GetBytes(postData));
        var contentHashString = AWS4SignerBase.ToHexString(contentHash, true);
        
        var uri = new Uri(endpointUri);

        var headers = new Dictionary<string, string>
        {
            {AWS4SignerBase.X_Amz_Content_SHA256, AWS4SignerBase.EMPTY_BODY_SHA256},
        };

        var signer = new AWS4SignerForPOST
        {
            EndpointUri = uri,
            HttpMethod = "POST",
            Service = _serviceName,
            Region = _regionName
        };

        //Extract the query parameters
        var queryParams = "";
        if (url.Split('?').Length > 1)
        {
            queryParams = url.Split('?')[1];
        }

        var authorization = signer.ComputeSignature(headers,
            queryParams,
            contentHashString,
            credentials.AccessKey,
            credentials.SecretKey);

        headers.Add("Authorization", authorization);

        var request = new HttpRequestMessage
        {
            Method = HttpMethod.Post,
            RequestUri = new Uri(url),
            Content = new StringContent(postData)
        };

        // Add the generated headers to the request
        foreach (var header in headers)
        {
            try
            {
                if (header.Key != null && header.Value != null)
                    request.Headers.Add(header.Key, header.Value);
            }
            catch (Exception e)
            {
                Console.WriteLine("error: " + e.GetType().ToString());
            }
        }

        // Add the IAM authentication token
        request.Headers.Add("x-amz-security-token", credentials.Token);

        return request;
    }
    
    public String UriEncode (string strInput, bool encodeSlash)
    {
        char[] input = strInput.ToCharArray ();
        StringBuilder result = new StringBuilder ();
        for (int i = 0; i < input.Length; i++) {
            char ch = input [i];
            if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9') || ch == '_' || ch == '-' || ch == '~' || ch == '.') {
                result.Append (ch);
            } else if (ch == '/') {
                result.Append (encodeSlash ? "%2F" : ch.ToString ());
            } else {
                result.Append ("%" + Convert.ToByte (ch).ToString ("x2").ToUpper ());
            }
        }
        return result.ToString ();
    }
}