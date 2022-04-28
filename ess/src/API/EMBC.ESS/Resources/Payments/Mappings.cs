﻿using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using AutoMapper;
using EMBC.ESS.Utilities.Cas;
using EMBC.ESS.Utilities.Dynamics.Microsoft.Dynamics.CRM;

namespace EMBC.ESS.Resources.Payments
{
    public class Mappings : Profile
    {
        public Mappings()
        {
            CreateMap<Payment, era_etransfertransaction>(MemberList.Source)
                .IncludeAllDerived()
                .ForSourceMember(s => s.Id, opts => opts.DoNotValidate())
                .ForMember(d => d.era_totalamount, opts => opts.MapFrom(s => s.Amount))
                .ForMember(d => d.statuscode, opts => opts.MapFrom(s => s.Status))
                .ForMember(d => d.era_processingresponse, opts => opts.MapFrom(s => s.FailureReason))
                .ForMember(d => d._era_payee_value, opts => opts.MapFrom(s => s.PayeeId))
                .ReverseMap()
                .ValidateMemberList(MemberList.Destination)
                .IncludeAllDerived()
                .ForMember(d => d.Id, opts => opts.MapFrom(s => s.era_name))
                .ForMember(d => d.Amount, opts => opts.MapFrom(s => s.era_totalamount))
                .ForMember(d => d.Status, opts => opts.MapFrom(s => s.statuscode))
                .ForMember(d => d.FailureReason, opts => opts.MapFrom(s => s.era_processingresponse))
                .ForMember(d => d.PayeeId, opts => opts.MapFrom(s => s._era_payee_value))
                ;

            CreateMap<InteracSupportPayment, era_etransfertransaction>(MemberList.Source)
                .ForSourceMember(s => s.LinkedSupportIds, opts => opts.DoNotValidate())
                .ForMember(d => d.era_firstname, opts => opts.MapFrom(s => s.RecipientFirstName))
                .ForMember(d => d.era_lastname, opts => opts.MapFrom(s => s.RecipientLastName))
                .ForMember(d => d.era_emailaddress, opts => opts.MapFrom(s => s.NotificationEmail))
                .ForMember(d => d.era_phonenumber, opts => opts.MapFrom(s => s.NotificationPhone))
                .ForMember(d => d.era_securityanswer, opts => opts.MapFrom(s => s.SecurityAnswer))
                .ForMember(d => d.era_securityquestion, opts => opts.MapFrom(s => s.SecurityQuestion))
                .ReverseMap()
                .ValidateMemberList(MemberList.Destination)
                .ForMember(d => d.RecipientFirstName, opts => opts.MapFrom(s => s.era_firstname))
                .ForMember(d => d.RecipientLastName, opts => opts.MapFrom(s => s.era_lastname))
                .ForMember(d => d.NotificationEmail, opts => opts.MapFrom(s => s.era_emailaddress))
                .ForMember(d => d.NotificationPhone, opts => opts.MapFrom(s => s.era_phonenumber))
                .ForMember(d => d.SecurityAnswer, opts => opts.MapFrom(s => s.era_securityanswer))
                .ForMember(d => d.SecurityQuestion, opts => opts.MapFrom(s => s.era_securityquestion))
                .ForMember(d => d.LinkedSupportIds, opts => opts.MapFrom(s => s.era_era_etransfertransaction_era_evacueesuppo.Select(s => s.era_name)))
                ;

            CreateMap<IEnumerable<era_etransfertransaction>, IEnumerable<Payment>>()
                .ConvertUsing((s, d, ctx) => s.Select(tx => ctx.Mapper.Map<InteracSupportPayment>(tx)))
                ;

            CreateMap<era_etransfertransaction, Invoice>(MemberList.None)
                .ForMember(d => d.SupplierNumber, opts => opts.MapFrom(s => s.era_suppliernumber))
                .ForMember(d => d.SupplierSiteNumber, opts => opts.MapFrom(s => s.era_sitesuppliernumber))
                .ForMember(d => d.InvoiceNumber, opts => opts.MapFrom(s => s.era_name))
                .ForMember(d => d.DateInvoiceReceived, opts => opts.MapFrom(s => s.era_invoicedate.Value.DateTime))
                .ForMember(d => d.InvoiceDate, opts => opts.MapFrom(s => s.era_invoicedate.Value.DateTime))
                .ForMember(d => d.GlDate, opts => opts.MapFrom(s => s.era_gldate.Value.DateTime))
                .ForMember(d => d.InvoiceAmount, opts => opts.MapFrom(s => s.era_totalamount))
                .ForMember(d => d.InteracEmail, opts => opts.MapFrom(s => s.era_emailaddress))
                .ForMember(d => d.InteracMobileCountryCode, opts => opts.MapFrom(s => s.era_phonenumber == null ? null : "1"))
                .ForMember(d => d.InteracMobileNumber, opts => opts.MapFrom(s => Regex.Replace(s.era_phonenumber, @"^(\+)|\D", "$1")))
                .ForMember(d => d.RemittanceMessage1, opts => opts.MapFrom(s => s.era_securityquestion))
                .ForMember(d => d.RemittanceMessage2, opts => opts.MapFrom(s => s.era_securityanswer))
                .ForMember(d => d.InvoiceLineDetails, opts => opts.MapFrom(s => new[]
                    {
                        new InvoiceLineDetail
                        {
                            InvoiceLineAmount = s.era_totalamount.Value
                        }
                    }))
                ;
        }
    }
}
