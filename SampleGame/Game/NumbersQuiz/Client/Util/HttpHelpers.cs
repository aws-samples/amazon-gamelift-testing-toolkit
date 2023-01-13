// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Text;

namespace AWSSignatureV4_S3_Sample.Util
{
    // Various Http helper routines
    public static class HttpHelpers
    {
        // Helper routine to url encode canonicalized header names and values for safe inclusion in presigned urls
        public static string UrlEncode(string data, bool isPath = false)
        {
            // Set of accepted and valid Url characters per RFC3986.
            const string validUrlCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.~";

            var encoded = new StringBuilder(data.Length * 2);
            string unreservedChars = String.Concat(validUrlCharacters, (isPath ? "/:" : ""));

            foreach (char symbol in System.Text.Encoding.UTF8.GetBytes(data))
            {
                if (unreservedChars.IndexOf(symbol) != -1)
                {
                    encoded.Append(symbol);
                }
                else
                {
                    encoded.Append("%").Append(String.Format("{0:X2}", (int)symbol));
                }
            }

            return encoded.ToString();
        }
    }
}