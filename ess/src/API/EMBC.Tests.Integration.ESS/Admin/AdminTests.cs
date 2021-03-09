﻿using System;
using System.Linq;
using System.Threading.Tasks;
using EMBC.ESS;
using EMBC.ESS.Managers.Admin;
using EMBC.ESS.Managers.Location;
using EMBC.ESS.Shared.Contracts.Location;
using EMBC.ESS.Shared.Contracts.Team;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Shouldly;
using Xunit;
using Xunit.Abstractions;

namespace EMBC.Tests.Integration.ESS.Admin
{
    public class AdminTests : WebAppTestBase
    {
        private readonly AdminManager adminManager;

        public string teamId { get; }

        public AdminTests(ITestOutputHelper output, WebApplicationFactory<Startup> webApplicationFactory) : base(output, webApplicationFactory)
        {
            adminManager = services.GetRequiredService<AdminManager>();
            teamId = "3f132f42-b74f-eb11-b822-00505683fbf4";
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanCreateMember()
        {
            var now = DateTime.Now;
            var newMember = new TeamMember
            {
                Email = "email@email.com",
                FirstName = "first",
                LastName = "last",
                IsActive = true,
                Label = "label",
                Role = new TeamRole { Id = "r1", Name = "role1" },
                AgreementSignDate = now,
                LastSuccessfulLogin = now,
                ExternalUserId = "extid",
                Phone = "1234",
                TeamId = teamId,
                UserName = "username"
            };

            var reply = await adminManager.Handle(new SaveTeamMemberCommand { Member = newMember });

            reply.MemberId.ShouldNotBeNull();

            var existingMember = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId, MemberId = reply.MemberId })).TeamMembers.ShouldHaveSingleItem();

            existingMember.Id.ShouldBe(reply.MemberId);
            existingMember.TeamId.ShouldBe(teamId);
            existingMember.Email.ShouldBe(newMember.Email);
            // existingMember.Phone.ShouldBe(newMember.Phone);
            existingMember.FirstName.ShouldBe(newMember.FirstName);
            existingMember.LastName.ShouldBe(newMember.LastName);
            // existingMember.UserName.ShouldBe(newMember.UserName);
            existingMember.ExternalUserId.ShouldBe(newMember.ExternalUserId);
            existingMember.IsActive.ShouldBe(newMember.IsActive);
            // existingMember.LastSuccessfulLogin.ShouldBe(newMember.LastSuccessfulLogin);
            existingMember.AgreementSignDate.ShouldBe(newMember.AgreementSignDate.Value.Date);
            //existingMember.Label.ShouldBe(newMember.Label);
            //existingMember.Role.Id.ShouldBe(newMember.Role.Id);
            //existingMember.Role.Name.ShouldBe(newMember.Role.Name);
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanActivateTeamMember()
        {
            var memberToUpdate = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId })).TeamMembers.First();

            await adminManager.Handle(new ActivateTeamMemberCommand { TeamId = teamId, MemberId = memberToUpdate.Id });

            var updatedMember = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId, MemberId = memberToUpdate.Id })).TeamMembers.Single();
            updatedMember.IsActive.ShouldBeTrue();
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanDeActivateTeamMember()
        {
            var memberToUpdate = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId })).TeamMembers.First();

            await adminManager.Handle(new DeactivateTeamMemberCommand { TeamId = teamId, MemberId = memberToUpdate.Id });

            var updatedMember = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId, MemberId = memberToUpdate.Id })).TeamMembers.Single();
            updatedMember.IsActive.ShouldBeFalse();
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanDeleteTeamMember()
        {
            var memberToDelete = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId })).TeamMembers.First();

            await adminManager.Handle(new DeleteTeamMemberCommand { TeamId = teamId, MemberId = memberToDelete.Id });

            var teamMembers = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId, MemberId = memberToDelete.Id })).TeamMembers;
            teamMembers.Where(m => m.Id == memberToDelete.Id).ShouldBeEmpty();
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanValidateUniqueUserName()
        {
            var validationResult = await adminManager.Handle(new ValidateTeamMemberCommand { UniqueUserName = "user1" });
            validationResult.UniqueUserName.ShouldBeTrue();
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanValidateDuplicateUserName()
        {
            var aMember = (await adminManager.Handle(new TeamMembersQueryCommand { TeamId = teamId })).TeamMembers.First();

            var validationResult = await adminManager.Handle(new ValidateTeamMemberCommand { UniqueUserName = aMember.UserName });
            validationResult.UniqueUserName.ShouldBeFalse();
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanQuerySingleTeam()
        {
            var team = (await adminManager.Handle(new TeamsQueryCommand { TeamId = teamId })).Teams.ShouldHaveSingleItem();
            team.Id.ShouldBe(teamId);
            team.Name.ShouldNotBeNull();
            team.AssignedCommunities.ShouldNotBeEmpty();
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanQueryAllTeams()
        {
            var teams = (await adminManager.Handle(new TeamsQueryCommand())).Teams;

            teams.Count().ShouldNotBe(0);
            teams.ShouldAllBe(t => t.AssignedCommunities.Any());
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanAssignCommunitiesToTeam()
        {
            var locationManager = services.GetRequiredService<LocationManager>();
            var communities = (await locationManager.Handle(new CommunitiesQueryCommand())).Items;

            var team = (await adminManager.Handle(new TeamsQueryCommand { TeamId = teamId })).Teams.ShouldHaveSingleItem();

            var newCommunities = communities.Where(c => !team.AssignedCommunities.Contains(c.Code)).Take(5).Select(c => c.Code);

            await adminManager.Handle(new AssignCommunitiesToTeamCommand { TeamId = teamId, Communities = newCommunities });

            var updatedTeam = (await adminManager.Handle(new TeamsQueryCommand { TeamId = teamId })).Teams.ShouldHaveSingleItem();

            updatedTeam.AssignedCommunities.OrderBy(c => c).ShouldBe(team.AssignedCommunities.Concat(newCommunities).OrderBy(c => c));
        }

        [Fact(Skip = RequiresDynamics)]
        public async Task CanUnassignCommunitiesToTeam()
        {
            var team = (await adminManager.Handle(new TeamsQueryCommand { TeamId = teamId })).Teams.ShouldHaveSingleItem();

            var removedCommunities = team.AssignedCommunities.Take(2);

            await adminManager.Handle(new UnassignCommunitiesFromTeamCommand { TeamId = teamId, Communities = removedCommunities });

            var updatedTeam = (await adminManager.Handle(new TeamsQueryCommand { TeamId = teamId })).Teams.ShouldHaveSingleItem();

            updatedTeam.AssignedCommunities.Where(c => removedCommunities.Contains(c)).ShouldBeEmpty();
        }
    }
}