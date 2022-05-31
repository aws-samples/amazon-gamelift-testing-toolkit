// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public class PlayerProfileAttributeSpecifiedConcreteClassConverter : DefaultContractResolver
    {
        protected override JsonConverter ResolveContractConverter(Type objectType)
        {
            if (typeof(PlayerProfileAttribute).IsAssignableFrom(objectType) && !objectType.IsAbstract)
                return null; // pretend TableSortRuleConvert is not specified (thus avoiding a stack overflow)
            return base.ResolveContractConverter(objectType);
        }
    }

    public class PlayerProfileAttributeConverter : JsonConverter
    {
        static JsonSerializerSettings SpecifiedSubclassConversion = new JsonSerializerSettings() { ContractResolver = new PlayerProfileAttributeSpecifiedConcreteClassConverter() };

        public override bool CanConvert(Type objectType)
        {
            return (objectType == typeof(PlayerProfileAttribute));
        }

        public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            JObject jo = JObject.Load(reader);
            switch (jo["AttributeType"].Value<string>())
            {
                case "S":
                    return JsonConvert.DeserializeObject<PlayerStringAttribute>(jo.ToString(), SpecifiedSubclassConversion);
                case "SL":
                    if (jo["ValueType"].Value<string>() == "randomStringList")
                    {
                        return JsonConvert.DeserializeObject<PlayerRandStringListAttribute>(jo.ToString(), SpecifiedSubclassConversion);
                    }
                    else
                    {
                        return JsonConvert.DeserializeObject<PlayerStringListAttribute>(jo.ToString(), SpecifiedSubclassConversion);
                    }
                case "SDM":
                    return JsonConvert.DeserializeObject<PlayerDoubleMapAttribute>(jo.ToString(), SpecifiedSubclassConversion);
                case "N":
                    if (jo["ValueType"].Value<string>() == "randomInteger")
                    {
                        return JsonConvert.DeserializeObject<PlayerRandIntegerAttribute>(jo.ToString(), SpecifiedSubclassConversion);
                    }
                    else
                    if (jo["ValueType"].Value<string>() == "randomDouble")
                    {
                        return JsonConvert.DeserializeObject<PlayerRandDoubleAttribute>(jo.ToString(), SpecifiedSubclassConversion);
                    }
                    else
                    if (jo["ValueType"].Value<string>() == "value")
                    {
                        return JsonConvert.DeserializeObject<PlayerNumberAttribute>(jo.ToString(), SpecifiedSubclassConversion);
                    }

                    break;
                default:
                    throw new Exception();
            }
            throw new NotImplementedException();
        }

        public override bool CanWrite
        {
            get { return false; }
        }

        public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
        {
            throw new NotImplementedException(); // won't be called because CanWrite returns false
        }
    }
}