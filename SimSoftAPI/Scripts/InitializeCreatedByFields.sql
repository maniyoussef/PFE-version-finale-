-- SQL Script to update legacy tickets with missing CreatedById values
-- This script identifies tickets with null CreatedById and sets them based on the Project's ClientId

-- First, make sure the CreatedById column exists in the Tickets table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'CreatedById' AND Object_ID = Object_ID(N'Tickets'))
BEGIN
    ALTER TABLE Tickets ADD CreatedById INT NULL;
    PRINT 'Added CreatedById column to Tickets table';
END

-- Update all Tickets where CreatedById is NULL by using the ClientId from the associated Project
UPDATE t
SET t.CreatedById = p.ClientId
FROM Tickets t
JOIN Projects p ON t.ProjectId = p.Id
WHERE t.CreatedById IS NULL;

-- Log how many tickets were updated
DECLARE @RowCount INT = @@ROWCOUNT;
PRINT CONCAT('Updated CreatedById for ', @RowCount, ' legacy tickets'); 