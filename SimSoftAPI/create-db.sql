START TRANSACTION;

ALTER TABLE `Projects` ADD `Status` longtext CHARACTER SET utf8mb4 NOT NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250219105222_UpdateCompanyModel', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250219105945_InitialCreat', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Companies` MODIFY COLUMN `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Email` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `ContactPerson` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250219115209_FixCompanyColumnTypes', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Projects` DROP FOREIGN KEY `FK_Projects_Companies_CompanyId`;

ALTER TABLE `Projects` DROP INDEX `IX_Projects_CompanyId`;

ALTER TABLE `Projects` DROP COLUMN `CompanyId`;

ALTER TABLE `Companies` MODIFY COLUMN `Phone` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Address` longtext CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250219131743_RemoveCompanyFromProject', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` MODIFY COLUMN `Title` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Tickets` ADD `Attachment` longtext CHARACTER SET utf8mb4 NOT NULL;

UPDATE `Companies` SET `Phone` = ''
WHERE `Phone` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `Companies` MODIFY COLUMN `Phone` varchar(50) CHARACTER SET utf8mb4 NOT NULL;

UPDATE `Companies` SET `Address` = ''
WHERE `Address` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `Companies` MODIFY COLUMN `Address` varchar(500) CHARACTER SET utf8mb4 NOT NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250224095838_addAttachementelement', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250224100221_AddAttachmentToTickets', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250224100930_InitialMigration', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250224141925_UpdataTicket', '8.0.2');

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS `POMELO_BEFORE_DROP_PRIMARY_KEY`;
DELIMITER //
CREATE PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`(IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255))
BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID TINYINT(1);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `Extra` = 'auto_increment'
			AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `POMELO_AFTER_ADD_PRIMARY_KEY`;
DELIMITER //
CREATE PROCEDURE `POMELO_AFTER_ADD_PRIMARY_KEY`(IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255), IN `COLUMN_NAME_ARGUMENT` VARCHAR(255))
BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID INT(11);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
			AND `COLUMN_TYPE` LIKE '%int%'
			AND `COLUMN_KEY` = 'PRI';
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL AUTO_INCREMENT;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END //
DELIMITER ;

ALTER TABLE `Tickets` DROP FOREIGN KEY `FK_Tickets_users_AssignedToId`;

ALTER TABLE `users` DROP FOREIGN KEY `FK_users_Countries_CountryId`;

ALTER TABLE `users` DROP FOREIGN KEY `FK_users_Roles_RoleId`;

CALL POMELO_BEFORE_DROP_PRIMARY_KEY(NULL, 'users');
ALTER TABLE `users` DROP PRIMARY KEY;

ALTER TABLE `users` RENAME `Users`;

ALTER TABLE `Users` RENAME COLUMN `password` TO `Password`;

ALTER TABLE `Users` RENAME INDEX `IX_users_RoleId` TO `IX_Users_RoleId`;

ALTER TABLE `Users` RENAME INDEX `IX_users_CountryId` TO `IX_Users_CountryId`;

ALTER TABLE `Users` ADD CONSTRAINT `PK_Users` PRIMARY KEY (`Id`);
CALL POMELO_AFTER_ADD_PRIMARY_KEY(NULL, 'Users', 'Id');

ALTER TABLE `Tickets` ADD CONSTRAINT `FK_Tickets_Users_AssignedToId` FOREIGN KEY (`AssignedToId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT;

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Countries_CountryId` FOREIGN KEY (`CountryId`) REFERENCES `Countries` (`Id`) ON DELETE CASCADE;

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE CASCADE;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250228150009_collaborateurFIx', '8.0.2');

DROP PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`;

DROP PROCEDURE `POMELO_AFTER_ADD_PRIMARY_KEY`;

COMMIT;

START TRANSACTION;

ALTER TABLE `Users` RENAME COLUMN `Password` TO `PasswordHash`;

ALTER TABLE `Projects` ADD `ChefProjetId` int NULL;

CREATE TABLE `ProjectCollaborators` (
    `CollaborateursId` int NOT NULL,
    `ProjectsId` int NOT NULL,
    CONSTRAINT `PK_ProjectCollaborators` PRIMARY KEY (`CollaborateursId`, `ProjectsId`),
    CONSTRAINT `FK_ProjectCollaborators_Projects_ProjectsId` FOREIGN KEY (`ProjectsId`) REFERENCES `Projects` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ProjectCollaborators_Users_CollaborateursId` FOREIGN KEY (`CollaborateursId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Projects_ChefProjetId` ON `Projects` (`ChefProjetId`);

CREATE INDEX `IX_ProjectCollaborators_ProjectsId` ON `ProjectCollaborators` (`ProjectsId`);

ALTER TABLE `Projects` ADD CONSTRAINT `FK_Projects_Users_ChefProjetId` FOREIGN KEY (`ChefProjetId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250303130621_projectUpdate', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Users` ADD `UserId` int NULL;

CREATE INDEX `IX_Users_UserId` ON `Users` (`UserId`);

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250311210331_collab', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250317015320_col', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Users` ADD `PhoneNumber` longtext CHARACTER SET utf8mb4 NOT NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250317024129_colhgg', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Users` ADD `ContractEndDate` datetime(6) NULL;

ALTER TABLE `Users` ADD `ContractStartDate` datetime(6) NULL;

CREATE TABLE `UserCompanies` (
    `CompaniesId` int NOT NULL,
    `UsersId` int NOT NULL,
    CONSTRAINT `PK_UserCompanies` PRIMARY KEY (`CompaniesId`, `UsersId`),
    CONSTRAINT `FK_UserCompanies_Companies_CompaniesId` FOREIGN KEY (`CompaniesId`) REFERENCES `Companies` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_UserCompanies_Users_UsersId` FOREIGN KEY (`UsersId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_UserCompanies_UsersId` ON `UserCompanies` (`UsersId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250317214517_AddUserCompaniesRelationship', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250317225403_AddUserCompaniesRelationsh', '8.0.2');

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS `POMELO_BEFORE_DROP_PRIMARY_KEY`;
DELIMITER //
CREATE PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`(IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255))
BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID TINYINT(1);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `Extra` = 'auto_increment'
			AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `POMELO_AFTER_ADD_PRIMARY_KEY`;
DELIMITER //
CREATE PROCEDURE `POMELO_AFTER_ADD_PRIMARY_KEY`(IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255), IN `COLUMN_NAME_ARGUMENT` VARCHAR(255))
BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID INT(11);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
			AND `COLUMN_TYPE` LIKE '%int%'
			AND `COLUMN_KEY` = 'PRI';
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL AUTO_INCREMENT;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END //
DELIMITER ;

ALTER TABLE `ProjectCollaborators` DROP FOREIGN KEY `FK_ProjectCollaborators_Projects_ProjectsId`;

ALTER TABLE `Users` DROP FOREIGN KEY `FK_Users_Users_UserId`;

ALTER TABLE `Users` DROP INDEX `IX_Users_UserId`;

CALL POMELO_BEFORE_DROP_PRIMARY_KEY(NULL, 'ProjectCollaborators');
ALTER TABLE `ProjectCollaborators` DROP PRIMARY KEY;

ALTER TABLE `ProjectCollaborators` DROP INDEX `IX_ProjectCollaborators_ProjectsId`;

ALTER TABLE `Users` DROP COLUMN `UserId`;

ALTER TABLE `ProjectCollaborators` RENAME COLUMN `ProjectsId` TO `AssignedProjectsId`;

ALTER TABLE `Users` MODIFY COLUMN `PhoneNumber` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Projects` MODIFY COLUMN `Description` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Phone` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Name` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Email` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `ContactPerson` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Address` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `ProjectCollaborators` ADD CONSTRAINT `PK_ProjectCollaborators` PRIMARY KEY (`AssignedProjectsId`, `CollaborateursId`);

CREATE TABLE `UserCollaborateurs` (
    `AssignedCollaborateursId` int NOT NULL,
    `UserId` int NOT NULL,
    CONSTRAINT `PK_UserCollaborateurs` PRIMARY KEY (`AssignedCollaborateursId`, `UserId`),
    CONSTRAINT `FK_UserCollaborateurs_Users_AssignedCollaborateursId` FOREIGN KEY (`AssignedCollaborateursId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_UserCollaborateurs_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_ProjectCollaborators_CollaborateursId` ON `ProjectCollaborators` (`CollaborateursId`);

CREATE INDEX `IX_UserCollaborateurs_UserId` ON `UserCollaborateurs` (`UserId`);

ALTER TABLE `ProjectCollaborators` ADD CONSTRAINT `FK_ProjectCollaborators_Projects_AssignedProjectsId` FOREIGN KEY (`AssignedProjectsId`) REFERENCES `Projects` (`Id`) ON DELETE CASCADE;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250318003236_UserCompanyProjectRelations', '8.0.2');

DROP PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`;

DROP PROCEDURE `POMELO_AFTER_ADD_PRIMARY_KEY`;

COMMIT;

START TRANSACTION;

DROP PROCEDURE IF EXISTS `POMELO_BEFORE_DROP_PRIMARY_KEY`;
DELIMITER //
CREATE PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`(IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255))
BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID TINYINT(1);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `Extra` = 'auto_increment'
			AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_KEY` = 'PRI'
			LIMIT 1;
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END //
DELIMITER ;

DROP PROCEDURE IF EXISTS `POMELO_AFTER_ADD_PRIMARY_KEY`;
DELIMITER //
CREATE PROCEDURE `POMELO_AFTER_ADD_PRIMARY_KEY`(IN `SCHEMA_NAME_ARGUMENT` VARCHAR(255), IN `TABLE_NAME_ARGUMENT` VARCHAR(255), IN `COLUMN_NAME_ARGUMENT` VARCHAR(255))
BEGIN
	DECLARE HAS_AUTO_INCREMENT_ID INT(11);
	DECLARE PRIMARY_KEY_COLUMN_NAME VARCHAR(255);
	DECLARE PRIMARY_KEY_TYPE VARCHAR(255);
	DECLARE SQL_EXP VARCHAR(1000);
	SELECT COUNT(*)
		INTO HAS_AUTO_INCREMENT_ID
		FROM `information_schema`.`COLUMNS`
		WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
			AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
			AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
			AND `COLUMN_TYPE` LIKE '%int%'
			AND `COLUMN_KEY` = 'PRI';
	IF HAS_AUTO_INCREMENT_ID THEN
		SELECT `COLUMN_TYPE`
			INTO PRIMARY_KEY_TYPE
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SELECT `COLUMN_NAME`
			INTO PRIMARY_KEY_COLUMN_NAME
			FROM `information_schema`.`COLUMNS`
			WHERE `TABLE_SCHEMA` = (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA()))
				AND `TABLE_NAME` = TABLE_NAME_ARGUMENT
				AND `COLUMN_NAME` = COLUMN_NAME_ARGUMENT
				AND `COLUMN_TYPE` LIKE '%int%'
				AND `COLUMN_KEY` = 'PRI';
		SET SQL_EXP = CONCAT('ALTER TABLE `', (SELECT IFNULL(SCHEMA_NAME_ARGUMENT, SCHEMA())), '`.`', TABLE_NAME_ARGUMENT, '` MODIFY COLUMN `', PRIMARY_KEY_COLUMN_NAME, '` ', PRIMARY_KEY_TYPE, ' NOT NULL AUTO_INCREMENT;');
		SET @SQL_EXP = SQL_EXP;
		PREPARE SQL_EXP_EXECUTE FROM @SQL_EXP;
		EXECUTE SQL_EXP_EXECUTE;
		DEALLOCATE PREPARE SQL_EXP_EXECUTE;
	END IF;
END //
DELIMITER ;

ALTER TABLE `ProjectCollaborators` DROP FOREIGN KEY `FK_ProjectCollaborators_Projects_AssignedProjectsId`;

DROP TABLE `UserCollaborateurs`;

CALL POMELO_BEFORE_DROP_PRIMARY_KEY(NULL, 'ProjectCollaborators');
ALTER TABLE `ProjectCollaborators` DROP PRIMARY KEY;

ALTER TABLE `ProjectCollaborators` DROP INDEX `IX_ProjectCollaborators_CollaborateursId`;

ALTER TABLE `ProjectCollaborators` RENAME COLUMN `AssignedProjectsId` TO `ProjectsId`;

ALTER TABLE `Users` ADD `UserId` int NULL;

UPDATE `Companies` SET `Phone` = ''
WHERE `Phone` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `Companies` MODIFY COLUMN `Phone` varchar(50) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `Email` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Companies` MODIFY COLUMN `ContactPerson` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

UPDATE `Companies` SET `Address` = ''
WHERE `Address` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `Companies` MODIFY COLUMN `Address` varchar(500) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `ProjectCollaborators` ADD CONSTRAINT `PK_ProjectCollaborators` PRIMARY KEY (`CollaborateursId`, `ProjectsId`);

CREATE INDEX `IX_Users_UserId` ON `Users` (`UserId`);

CREATE INDEX `IX_ProjectCollaborators_ProjectsId` ON `ProjectCollaborators` (`ProjectsId`);

ALTER TABLE `ProjectCollaborators` ADD CONSTRAINT `FK_ProjectCollaborators_Projects_ProjectsId` FOREIGN KEY (`ProjectsId`) REFERENCES `Projects` (`Id`) ON DELETE CASCADE;

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250318211937_AddUserCompaniesRelat', '8.0.2');

DROP PROCEDURE `POMELO_BEFORE_DROP_PRIMARY_KEY`;

DROP PROCEDURE `POMELO_AFTER_ADD_PRIMARY_KEY`;

COMMIT;

START TRANSACTION;

ALTER TABLE `Users` DROP FOREIGN KEY `FK_Users_Countries_CountryId`;

ALTER TABLE `Users` DROP FOREIGN KEY `FK_Users_Roles_RoleId`;

ALTER TABLE `Users` DROP FOREIGN KEY `FK_Users_Users_UserId`;

ALTER TABLE `Users` RENAME COLUMN `UserId` TO `ChefProjetId`;

ALTER TABLE `Users` RENAME INDEX `IX_Users_UserId` TO `IX_Users_ChefProjetId`;

ALTER TABLE `Tickets` MODIFY COLUMN `Status` varchar(50) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Tickets` MODIFY COLUMN `Priority` varchar(50) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Tickets` MODIFY COLUMN `Description` varchar(2000) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Projects` MODIFY COLUMN `Status` varchar(50) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Projects` MODIFY COLUMN `StartDate` datetime(6) NULL;

ALTER TABLE `Projects` MODIFY COLUMN `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

UPDATE `Projects` SET `Description` = ''
WHERE `Description` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `Projects` MODIFY COLUMN `Description` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Projects` MODIFY COLUMN `ChefProjetId` int NOT NULL DEFAULT 0;

ALTER TABLE `ProblemCategories` MODIFY COLUMN `Name` varchar(255) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `ProblemCategories` MODIFY COLUMN `Description` varchar(1000) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Countries_CountryId` FOREIGN KEY (`CountryId`) REFERENCES `Countries` (`Id`) ON DELETE RESTRICT;

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`Id`) ON DELETE RESTRICT;

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Users_ChefProjetId` FOREIGN KEY (`ChefProjetId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250326015914_AddUserCompaniesRel', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` ADD `Commentaire` longtext CHARACTER SET utf8mb4 NOT NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250326095731_AddUserCompani', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250326103446_ticketupdate', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` ADD `Report` longtext CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250407185448_AddReportFieldToTickets', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` RENAME COLUMN `Report` TO `rapport`;

UPDATE `Tickets` SET `rapport` = ''
WHERE `rapport` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `Tickets` MODIFY COLUMN `rapport` longtext CHARACTER SET utf8mb4 NOT NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250407202755_AddReportFieldToTicket', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` ADD `UpdatedAt` datetime(6) NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250408164032_AddReportFieldToTic', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` ADD `ChefProjetId` int NOT NULL DEFAULT 0;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250408165229_AddReportFieldToT', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` DROP COLUMN `ChefProjetId`;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250408170318_AddReportFieldToTi', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` RENAME COLUMN `UpdatedAt` TO `updated_at`;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250408171401_AddRepo', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250408173448_FinalColumnMappings', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250408180743_FinalColumnMappin', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250408181120_FinalColumnMappinghgh', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250414100854_AddChefProjetIdToProjects', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250414101229_AddChefProjetIdToProjec', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250414102714_AddChefProjetIdToProj', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250414104728_AddChefProjetIdToP', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250414143448_AddChefProjetIP', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250414144453_AddChefProje', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250414145440_AddChef', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250416115555_AddTicketWorkflowProperties', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` ADD `FinishWorkTime` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Tickets` ADD `StartWorkTime` longtext CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Tickets` ADD `TemporarilyStopped` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Tickets` ADD `WorkDuration` int NULL;

ALTER TABLE `Tickets` ADD `WorkFinished` tinyint(1) NOT NULL DEFAULT FALSE;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250416123016_AddMissingTicketWorkflowProperties', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Projects` ADD `ClientId` int NULL;

CREATE INDEX `IX_Projects_ClientId` ON `Projects` (`ClientId`);

ALTER TABLE `Projects` ADD CONSTRAINT `FK_Projects_Users_ClientId` FOREIGN KEY (`ClientId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250419233418_AddClientIdToProjects', '8.0.2');

COMMIT;

START TRANSACTION;

CREATE TABLE `ClientProblemCategories` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ClientId` int NOT NULL,
    `ProblemCategoryId` int NOT NULL,
    `AssignedDate` datetime(6) NOT NULL,
    CONSTRAINT `PK_ClientProblemCategories` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ClientProblemCategories_ProblemCategories_ProblemCategoryId` FOREIGN KEY (`ProblemCategoryId`) REFERENCES `ProblemCategories` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ClientProblemCategories_Users_ClientId` FOREIGN KEY (`ClientId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `UserProblemCategories` (
    `AssignedProblemCategoriesId` int NOT NULL,
    `UserId` int NOT NULL,
    CONSTRAINT `PK_UserProblemCategories` PRIMARY KEY (`AssignedProblemCategoriesId`, `UserId`),
    CONSTRAINT `FK_UserProblemCategories_ProblemCategories_AssignedProblemCateg~` FOREIGN KEY (`AssignedProblemCategoriesId`) REFERENCES `ProblemCategories` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_UserProblemCategories_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_ClientProblemCategories_ClientId` ON `ClientProblemCategories` (`ClientId`);

CREATE INDEX `IX_ClientProblemCategories_ProblemCategoryId` ON `ClientProblemCategories` (`ProblemCategoryId`);

CREATE INDEX `IX_UserProblemCategories_UserId` ON `UserProblemCategories` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250420001235_AddClientProblemCategoryTable', '8.0.2');

COMMIT;

START TRANSACTION;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250420001733_AddClientProblemCategory', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `Tickets` ADD `CreatedById` int NULL;

CREATE INDEX `IX_Tickets_CreatedById` ON `Tickets` (`CreatedById`);

ALTER TABLE `Tickets` ADD CONSTRAINT `FK_Tickets_Users_CreatedById` FOREIGN KEY (`CreatedById`) REFERENCES `Users` (`Id`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250421132616_AddClientIdToProjts', '8.0.2');

COMMIT;

START TRANSACTION;

CREATE TABLE `CollaborateurChefs` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CollaborateurId` int NOT NULL,
    `ChefProjetId` int NOT NULL,
    `AssignedDate` datetime(6) NOT NULL,
    CONSTRAINT `PK_CollaborateurChefs` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_CollaborateurChefs_Users_ChefProjetId` FOREIGN KEY (`ChefProjetId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_CollaborateurChefs_Users_CollaborateurId` FOREIGN KEY (`CollaborateurId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_CollaborateurChefs_ChefProjetId` ON `CollaborateurChefs` (`ChefProjetId`);

CREATE INDEX `IX_CollaborateurChefs_CollaborateurId` ON `CollaborateurChefs` (`CollaborateurId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250428233221_AddCollaborateurChefTable', '8.0.2');

COMMIT;

START TRANSACTION;

CREATE TABLE `ProjectClients` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ProjectId` int NOT NULL,
    `ClientId` int NOT NULL,
    CONSTRAINT `PK_ProjectClients` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ProjectClients_Projects_ProjectId` FOREIGN KEY (`ProjectId`) REFERENCES `Projects` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ProjectClients_Users_ClientId` FOREIGN KEY (`ClientId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_ProjectClients_ClientId` ON `ProjectClients` (`ClientId`);

CREATE INDEX `IX_ProjectClients_ProjectId` ON `ProjectClients` (`ProjectId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250429142959_AddProjectClientTable', '8.0.2');

COMMIT;

START TRANSACTION;

ALTER TABLE `CollaborateurChefs` DROP INDEX `IX_CollaborateurChefs_CollaborateurId`;

CREATE UNIQUE INDEX `IX_CollaborateurChefs_CollaborateurId_ChefProjetId` ON `CollaborateurChefs` (`CollaborateurId`, `ChefProjetId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250429145344_AddUniqueConstraintToCollaborateurChef', '8.0.2');

COMMIT;

START TRANSACTION;

CREATE TABLE `ProjectChefs` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ProjectId` int NOT NULL,
    `ChefProjetId` int NOT NULL,
    `AssignedDate` datetime(6) NOT NULL,
    CONSTRAINT `PK_ProjectChefs` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ProjectChefs_Projects_ProjectId` FOREIGN KEY (`ProjectId`) REFERENCES `Projects` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ProjectChefs_Users_ChefProjetId` FOREIGN KEY (`ChefProjetId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_ProjectChefs_ChefProjetId` ON `ProjectChefs` (`ChefProjetId`);

CREATE UNIQUE INDEX `IX_ProjectChefs_ProjectId_ChefProjetId` ON `ProjectChefs` (`ProjectId`, `ChefProjetId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20250429155609_CreateProjectChefTable', '8.0.2');

COMMIT;

