/**
 * Migration de référence (baseline) du schéma Maze NFC Cards.
 *
 * Cette migration représente l'état actuel complet des modèles Sequelize.
 * Elle est destinée à initialiser une base PostgreSQL vide.
 *
 * Important : les anciennes migrations incrémentales déjà absorbées par cette
 * baseline ne doivent pas être exécutées après celle-ci.
 */

module.exports = {
    async up(queryInterface, Sequelize, transaction) {
        const options = { transaction };
        const uuidDefault = Sequelize.literal("gen_random_uuid()");
        const nowDefault = Sequelize.literal("CURRENT_TIMESTAMP");

        const timestamps = {
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: nowDefault,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: nowDefault,
            },
        };

        await queryInterface.sequelize.query(
            'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
            options
        );

        await queryInterface.createTable(
            "roles",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                name: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("roles", ["name"], {
            name: "roles_name_unique",
            unique: true,
            transaction,
        });

        await queryInterface.createTable(
            "card_types",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                name: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                },
                subtypes: {
                    type: Sequelize.JSON,
                    allowNull: true,
                    defaultValue: [],
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("card_types", ["name"], {
            name: "card_types_name_unique",
            unique: true,
            transaction,
        });

        await queryInterface.createTable(
            "settings",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                key: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                    comment: "Clé du paramètre (ex: platform_name, support_email)",
                },
                value: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                label: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                    comment: "Label affiché dans l'UI",
                },
                group: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    defaultValue: "general",
                    comment: "Groupe de paramètres (general, notifications, security)",
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("settings", ["key"], {
            name: "settings_key_unique",
            unique: true,
            transaction,
        });

        // Créée avant users pour résoudre la dépendance circulaire :
        // enterprises.createdBy -> users.id
        // users.enterpriseId -> enterprises.id
        await queryInterface.createTable(
            "enterprises",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                name: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                email: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                phone: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },
                location: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                },
                logo: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },
                adminFirstName: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                adminLastName: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                subscription: {
                    type: Sequelize.ENUM("Starter", "Pro", "Enterprise"),
                    allowNull: true,
                    defaultValue: "Starter",
                },
                status: {
                    type: Sequelize.ENUM("active", "suspended", "inactive"),
                    allowNull: true,
                    defaultValue: "active",
                },
                cardsCount: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: 0,
                },
                scansCount: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: 0,
                },
                modules: {
                    type: Sequelize.ARRAY(Sequelize.STRING),
                    allowNull: true,
                    defaultValue: Sequelize.literal(
                        "ARRAY['Fidélité']::VARCHAR(255)[]"
                    ),
                },
                createdBy: {
                    type: Sequelize.UUID,
                    allowNull: true,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("enterprises", ["name"], {
            name: "enterprises_name_unique",
            unique: true,
            transaction,
        });

        await queryInterface.addIndex("enterprises", ["email"], {
            name: "enterprises_email_unique",
            unique: true,
            transaction,
        });

        await queryInterface.createTable(
            "users",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                firstName: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                lastName: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                email: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                password: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: true,
                },
                mustChangePassword: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                roleId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "roles",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "RESTRICT",
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("users", ["email"], {
            name: "users_email_unique",
            unique: true,
            transaction,
        });

        await queryInterface.addIndex("users", ["roleId"], {
            name: "users_role_id_idx",
            transaction,
        });

        await queryInterface.addIndex("users", ["enterpriseId"], {
            name: "users_enterprise_id_idx",
            transaction,
        });

        await queryInterface.addConstraint("enterprises", {
            fields: ["createdBy"],
            type: "foreign key",
            name: "enterprises_created_by_fkey",
            references: {
                table: "users",
                field: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "SET NULL",
            transaction,
        });

        await queryInterface.addIndex("enterprises", ["createdBy"], {
            name: "enterprises_created_by_idx",
            transaction,
        });

        await queryInterface.createTable(
            "subscriptions",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                plan: {
                    type: Sequelize.ENUM("Starter", "Pro", "Enterprise"),
                    allowNull: false,
                },
                status: {
                    type: Sequelize.ENUM("active", "paused", "cancelled"),
                    allowNull: true,
                    defaultValue: "active",
                },
                cardsLimit: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: 1000,
                    comment: "Max number of cards allowed",
                },
                monthlyPrice: {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: true,
                    defaultValue: 0,
                },
                startDate: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: nowDefault,
                },
                renewalDate: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                cancelledAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("subscriptions", ["enterpriseId"], {
            name: "subscriptions_enterprise_id_unique",
            unique: true,
            transaction,
        });

        await queryInterface.createTable(
            "clients",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                name: {
                    type: Sequelize.STRING(255),
                    allowNull: false,
                },
                email: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                },
                phone: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                points: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: 0,
                },
                level: {
                    type: Sequelize.ENUM("Silver", "Gold", "Platinum"),
                    allowNull: true,
                    defaultValue: "Silver",
                },
                photo: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },
                status: {
                    type: Sequelize.ENUM("active", "suspended", "inactive"),
                    allowNull: true,
                    defaultValue: "active",
                },
                lastActivity: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("clients", ["enterpriseId"], {
            name: "clients_enterprise_id_idx",
            transaction,
        });

        await queryInterface.createTable(
            "services",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                name: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                pointsToAdd: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    defaultValue: 10,
                },
                scanToken: {
                    type: Sequelize.STRING(32),
                    allowNull: false,
                },
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
                icon: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                },
                color: {
                    type: Sequelize.STRING(20),
                    allowNull: true,
                    defaultValue: "#6A35FF",
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("services", ["scanToken"], {
            name: "services_scan_token_unique",
            unique: true,
            transaction,
        });

        await queryInterface.addIndex("services", ["enterpriseId"], {
            name: "services_enterprise_id_idx",
            transaction,
        });

        await queryInterface.createTable(
            "rewards",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                title: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                description: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                pointsRequired: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
                image: {
                    type: Sequelize.STRING(255),
                    allowNull: true,
                },
                category: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    defaultValue: "general",
                },
                stock: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("rewards", ["enterpriseId"], {
            name: "rewards_enterprise_id_idx",
            transaction,
        });

        await queryInterface.createTable(
            "nfc_cards",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                cardNumber: {
                    type: Sequelize.STRING(100),
                    allowNull: false,
                },
                cardCode: {
                    type: Sequelize.STRING(20),
                    allowNull: false,
                    comment: "Unique short code for URL (e.g., ABC123)",
                },
                scanToken: {
                    type: Sequelize.STRING(32),
                    allowNull: true,
                    comment: "Token unique pour l'URL de scan (généré automatiquement)",
                },
                cardTypeId: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: "card_types",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
                },
                stockBatchId: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                    comment: "Identifiant du lot de génération (ex: BATCH-2026-001)",
                },
                serviceId: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: "services",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
                    comment:
                        "Service associé à cette carte (optionnel, NULL = service choisi lors du scan)",
                },
                type: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                subtype: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },
                scanUrl: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                    comment:
                        "URL de scan générée dynamiquement: {baseUrl}/{entreprise}/{type}/{scanToken}",
                },
                status: {
                    type: Sequelize.ENUM("active", "inactive", "unassigned"),
                    allowNull: true,
                    defaultValue: "unassigned",
                },
                assignedToClientId: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: "clients",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
                },
                assignedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                generatedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: nowDefault,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("nfc_cards", ["cardNumber"], {
            name: "nfc_cards_card_number_unique",
            unique: true,
            transaction,
        });

        await queryInterface.addIndex("nfc_cards", ["cardCode"], {
            name: "nfc_cards_card_code_unique",
            unique: true,
            transaction,
        });

        await queryInterface.addIndex("nfc_cards", ["scanToken"], {
            name: "nfc_cards_scan_token_unique",
            unique: true,
            transaction,
        });

        await queryInterface.addIndex("nfc_cards", ["cardTypeId"], {
            name: "nfc_cards_card_type_id_idx",
            transaction,
        });

        await queryInterface.addIndex("nfc_cards", ["enterpriseId"], {
            name: "nfc_cards_enterprise_id_idx",
            transaction,
        });

        await queryInterface.addIndex("nfc_cards", ["serviceId"], {
            name: "nfc_cards_service_id_idx",
            transaction,
        });

        await queryInterface.addIndex("nfc_cards", ["assignedToClientId"], {
            name: "nfc_cards_assigned_client_id_idx",
            transaction,
        });

        await queryInterface.createTable(
            "scans",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                cardId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "nfc_cards",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                clientId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "clients",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                serviceId: {
                    type: Sequelize.UUID,
                    allowNull: true,
                    references: {
                        model: "services",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
                },
                scannedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: nowDefault,
                },
                userAgent: {
                    type: Sequelize.STRING(500),
                    allowNull: true,
                },
                ipAddress: {
                    type: Sequelize.STRING(50),
                    allowNull: true,
                },
                pointsAdded: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: 0,
                },
                notes: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("scans", ["cardId"], {
            name: "scans_card_id_idx",
            transaction,
        });

        await queryInterface.addIndex("scans", ["clientId"], {
            name: "scans_client_id_idx",
            transaction,
        });

        await queryInterface.addIndex("scans", ["enterpriseId"], {
            name: "scans_enterprise_id_idx",
            transaction,
        });

        await queryInterface.addIndex("scans", ["serviceId"], {
            name: "scans_service_id_idx",
            transaction,
        });

        await queryInterface.createTable(
            "redemptions",
            {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    primaryKey: true,
                    defaultValue: uuidDefault,
                },
                enterpriseId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "enterprises",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                clientId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "clients",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                rewardId: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    references: {
                        model: "rewards",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                },
                pointsUsed: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                status: {
                    type: Sequelize.ENUM("pending", "approved", "rejected", "completed"),
                    allowNull: false,
                    defaultValue: "pending",
                },
                notes: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                ...timestamps,
            },
            options
        );

        await queryInterface.addIndex("redemptions", ["enterpriseId"], {
            name: "redemptions_enterprise_id_idx",
            transaction,
        });

        await queryInterface.addIndex("redemptions", ["clientId"], {
            name: "redemptions_client_id_idx",
            transaction,
        });

        await queryInterface.addIndex("redemptions", ["rewardId"], {
            name: "redemptions_reward_id_idx",
            transaction,
        });

        // Contraintes métier présentes dans les validateurs Sequelize.
        await queryInterface.sequelize.query(
            `ALTER TABLE "services"
       ADD CONSTRAINT "services_points_to_add_non_negative"
       CHECK ("pointsToAdd" >= 0);`,
            options
        );

        await queryInterface.sequelize.query(
            `ALTER TABLE "rewards"
       ADD CONSTRAINT "rewards_points_required_positive"
       CHECK ("pointsRequired" >= 1);`,
            options
        );

        await queryInterface.sequelize.query(
            `ALTER TABLE "rewards"
       ADD CONSTRAINT "rewards_stock_non_negative"
       CHECK ("stock" IS NULL OR "stock" >= 0);`,
            options
        );

        await queryInterface.sequelize.query(
            `ALTER TABLE "redemptions"
       ADD CONSTRAINT "redemptions_points_used_positive"
       CHECK ("pointsUsed" >= 1);`,
            options
        );
    },

    async down(queryInterface, _Sequelize, transaction) {
        const options = { transaction };

        // Ordre inverse des dépendances.
        await queryInterface.dropTable("redemptions", options);
        await queryInterface.dropTable("scans", options);
        await queryInterface.dropTable("nfc_cards", options);
        await queryInterface.dropTable("rewards", options);
        await queryInterface.dropTable("services", options);
        await queryInterface.dropTable("clients", options);
        await queryInterface.dropTable("subscriptions", options);

        await queryInterface.removeConstraint(
            "enterprises",
            "enterprises_created_by_fkey",
            options
        );

        await queryInterface.dropTable("users", options);
        await queryInterface.dropTable("enterprises", options);
        await queryInterface.dropTable("settings", options);
        await queryInterface.dropTable("card_types", options);
        await queryInterface.dropTable("roles", options);

        const enumTypes = [
            "enum_redemptions_status",
            "enum_nfc_cards_status",
            "enum_clients_status",
            "enum_clients_level",
            "enum_subscriptions_status",
            "enum_subscriptions_plan",
            "enum_enterprises_status",
            "enum_enterprises_subscription",
        ];

        for (const enumType of enumTypes) {
            await queryInterface.sequelize.query(
                `DROP TYPE IF EXISTS "${enumType}";`,
                options
            );
        }
    },
};