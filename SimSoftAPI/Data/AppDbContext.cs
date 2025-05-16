using Microsoft.EntityFrameworkCore;
using SimSoftAPI.Models;

namespace SimSoftAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Country> Countries { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ProblemCategory> ProblemCategories { get; set; }
        public DbSet<ClientProblemCategory> ClientProblemCategories { get; set; }
        public DbSet<CollaborateurChef> CollaborateurChefs { get; set; }
        public DbSet<ProjectClient> ProjectClients { get; set; }
        public DbSet<ProjectChef> ProjectChefs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ProjectChef>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasIndex(e => new { e.ProjectId, e.ChefProjetId }).IsUnique();
                
                entity.HasOne(e => e.Project)
                    .WithMany()
                    .HasForeignKey(e => e.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.ChefProjet)
                    .WithMany()
                    .HasForeignKey(e => e.ChefProjetId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<CollaborateurChef>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasIndex(e => new { e.CollaborateurId, e.ChefProjetId }).IsUnique();
                
                entity.HasOne(e => e.Collaborateur)
                    .WithMany()
                    .HasForeignKey(e => e.CollaborateurId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.ChefProjet)
                    .WithMany()
                    .HasForeignKey(e => e.ChefProjetId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ProjectClient>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.Project)
                    .WithMany()
                    .HasForeignKey(e => e.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.Client)
                    .WithMany()
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<ClientProblemCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.Client)
                    .WithMany()
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.ProblemCategory)
                    .WithMany()
                    .HasForeignKey(e => e.ProblemCategoryId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Company>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255);
                
                entity.Property(e => e.ContactPerson)
                    .IsRequired()
                    .HasMaxLength(255);
                    
                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(255);
                    
                entity.Property(e => e.Address)
                    .IsRequired()
                    .HasMaxLength(500);
                    
                entity.Property(e => e.Phone)
                    .IsRequired()
                    .HasMaxLength(50);
            });

            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255);
                
                entity.Property(e => e.Status)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.HasOne(p => p.ChefProjet)
                    .WithMany(u => u.AssignedProjects)
                    .HasForeignKey(p => p.ChefProjetId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(p => p.Client)
                    .WithMany()
                    .HasForeignKey(p => p.ClientId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(p => p.Collaborateurs)
                    .WithMany(u => u.Projects)
                    .UsingEntity(j => 
                    {
                        j.ToTable("ProjectCollaborators");
                    });

                entity.HasMany(p => p.Tickets)
                    .WithOne(t => t.Project)
                    .HasForeignKey(t => t.ProjectId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(u => u.Country)
                    .WithMany(c => c.Users)
                    .HasForeignKey(u => u.CountryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(u => u.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(u => u.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(u => u.ChefProjet)
                    .WithMany(u => u.AssignedCollaborateurs)
                    .HasForeignKey(u => u.ChefProjetId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(u => u.Companies)
                    .WithMany(c => c.Users)
                    .UsingEntity(j => j.ToTable("UserCompanies"));

                entity.HasMany(u => u.AssignedProblemCategories)
                    .WithMany()
                    .UsingEntity(j => j.ToTable("UserProblemCategories"));
            });

            modelBuilder.Entity<Ticket>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Title)
                    .HasColumnName("Title")
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(e => e.Description)
                    .HasColumnName("Description")
                    .IsRequired()
                    .HasMaxLength(2000);

                entity.Property(e => e.Qualification)
                    .HasColumnName("Qualification")
                    .IsRequired();

                entity.Property(e => e.ProjectId)
                    .HasColumnName("ProjectId")
                    .IsRequired();

                entity.Property(e => e.ProblemCategoryId)
                    .HasColumnName("ProblemCategoryId")
                    .IsRequired();

                entity.Property(e => e.Priority)
                    .HasColumnName("Priority")
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.CreatedDate)
                    .HasColumnName("CreatedDate")
                    .HasColumnType("datetime(6)")
                    .IsRequired();

                entity.Property(e => e.Status)
                    .HasColumnName("Status")
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.AssignedToId)
                    .HasColumnName("AssignedToId")
                    .IsRequired();

                entity.Property(e => e.Attachment)
                    .HasColumnName("Attachment")
                    .IsRequired();

                entity.Property(e => e.Commentaire)
                    .HasColumnName("Commentaire")
                    .IsRequired();

                entity.Property(e => e.Report)
                    .HasColumnName("rapport")
                    .IsRequired();

                entity.Property(e => e.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasColumnType("datetime(6)")
                    .IsRequired(false);

                entity.HasOne(t => t.Project)
                    .WithMany(p => p.Tickets)
                    .HasForeignKey(t => t.ProjectId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.ProblemCategory)
                    .WithMany()
                    .HasForeignKey(t => t.ProblemCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(t => t.AssignedTo)
                    .WithMany()
                    .HasForeignKey(t => t.AssignedToId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<ProblemCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(255);
                
                entity.Property(e => e.Description)
                    .HasMaxLength(1000);
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Message)
                    .IsRequired()
                    .HasMaxLength(500);

                entity.Property(e => e.Type)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Route)
                    .HasMaxLength(200);

                entity.Property(e => e.CreatedAt)
                    .IsRequired();

                entity.Property(e => e.RelatedEntityId)
                    .IsRequired(false);

                entity.HasOne(n => n.User)
                    .WithMany()
                    .HasForeignKey(n => n.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(n => n.RelatedTicket)
                    .WithMany()
                    .HasForeignKey(n => n.RelatedTicketId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}